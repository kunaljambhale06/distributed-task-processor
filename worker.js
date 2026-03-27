import amqp from "amqplib";
import mongoose from "mongoose";
import Job from "./src/models/Job.js";
import dotenv from "dotenv";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import os from "os";
import Worker from "./src/models/Worker.js";

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const QUEUE = "jobQueue";
const DLQ = "failed_jobs";
const WORKER_ID = os.hostname() + "-" + process.pid;

const heartbeat = async () => {
  await Worker.findOneAndUpdate(
    { workerId: WORKER_ID },
    {
      workerId: WORKER_ID,
      lastSeen: new Date(),
    },
    { upsert: true }
  );
};

const startWorker = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Worker DB Connected");
    setInterval(heartbeat, 3000);

    const connectRabbit = async () => {
      while (true) {
        try {
          const conn = await amqp.connect(process.env.RABBITMQ_URL);
          return conn;
        } catch (err) {
          console.log("Waiting for RabbitMQ...");
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
    };

    const connection = await connectRabbit();
    const channel = await connection.createChannel();
    await channel.prefetch(1);

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

      const jobId = jobData._id || jobData.jobId;


      try {
         const jobFromDB = await Job.findOneAndUpdate(
          { status: "pending" },
          {
            status: "processing",
            startedAt: new Date(),
            workerId: WORKER_ID,
          },
          {
            sort: { priority: -1, createdAt: 1 },
            new: true,
          }
        );

        if (!jobFromDB) {
          channel.ack(msg);
          return;
        }

        console.log("🚀 Processing Job:", jobFromDB._id, "| Priority:", jobFromDB.priority);

        let processedPath = null;

        if (jobFromDB.imagePath) {
          const inputPath = jobFromDB.imagePath;
          const fileName = path.basename(inputPath);
          processedPath = `processed/${Date.now()}_${fileName}`;
          await sharp(inputPath)
            .resize(300)
            .jpeg({ quality: 60 })
            .toFile(processedPath);
          console.log("Saved:", processedPath);
        }

        // simulate old delay (keep your old logic feel)
        await new Promise((r) => setTimeout(r, 1000));

        const success = Math.random() > 0.9; // 10% success rate
        if (!success) throw new Error("Fail");

        await Job.findByIdAndUpdate(jobId, {
          status: "completed",
          finishedAt: new Date(),
          processedImagePath: processedPath || null,
        });

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

          console.log("Retrying job:", jobId);

          await Job.findByIdAndUpdate(jobId, {
            retries: retries + 1,
            status: "pending",
            startedAt: null,
            finishedAt: null,
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