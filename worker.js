import amqp from "amqplib";
import mongoose from "mongoose";
import Job from "./src/models/Job.js";
import dotenv from "dotenv";
import sharp from "sharp";
import fs from "fs";
import path from "path";

dotenv.config();

const QUEUE = "jobQueue";
const DLQ = "failed_jobs";

const startWorker = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Worker DB Connected");

    const connection = await amqp.connect("amqp://localhost");
    const channel = await connection.createChannel();

    // main queue with DLQ
    await channel.assertQueue(QUEUE, {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": "",
        "x-dead-letter-routing-key": DLQ,
      },
    });

    // DLQ
    await channel.assertQueue(DLQ, {
      durable: true,
    });

    console.log("Worker Waiting For Jobs...");

    channel.consume(QUEUE, async (msg) => {
      if (!msg) return;

      const jobData = JSON.parse(msg.content.toString());

      // IMPORTANT
      const jobId = jobData._id || jobData.jobId;

      console.log("Processing Job:", jobId);

      try {
        const jobFromDB = await Job.findById(jobId);

        if (!jobFromDB) {
          channel.ack(msg);
          return;
        }

        if (jobFromDB.status === "completed") {
          channel.ack(msg);
          return;
        }

        await Job.findByIdAndUpdate(jobId, {
          status: "processing",
        });



        if (jobFromDB.imagePath) {

          const inputPath = jobFromDB.imagePath;

          const fileName = path.basename(inputPath);

          const outputPath = `processed/${Date.now()}_${fileName}`;

          console.log("Processing image:", inputPath);

          await sharp(inputPath)
            .resize(300)
            .jpeg({ quality: 60 })
            .toFile(outputPath);

          await Job.findByIdAndUpdate(jobId, {
            processedImagePath: outputPath,
          });

          console.log("Saved:", outputPath);
        }

        // simulate old delay (keep your old logic feel)
        await new Promise((r) => setTimeout(r, 1000));

        const success = Math.random() > 0.9; // 10% success rate

        if (!success) throw new Error("Fail");

        await Job.findByIdAndUpdate(jobId, {
          status: "completed",
        });

        console.log("Completed:", jobId);

        channel.ack(msg);
      } catch (err) {
        const jobFromDB = await Job.findById(jobId);

        const retries = jobFromDB?.retries || 0;

        if (retries >= 3) {
          console.log("Send to DLQ:", jobId);

          await Job.findByIdAndUpdate(jobId, {
            status: "failed",
          });

          // DLQ
          channel.nack(msg, false, false);
        } else {
          console.log("Retry:", retries + 1);

          await Job.findByIdAndUpdate(jobId, {
            retries: retries + 1,
            status: "pending",
          });

          // retry
          channel.nack(msg, false, true);
        }
      }
    });
  } catch (err) {
    console.error(err);
  }
};

startWorker();