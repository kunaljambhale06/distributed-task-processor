import amqp from "amqplib";
import mongoose from "mongoose";
import Job from "./src/models/Job.js";
import dotenv from "dotenv";

dotenv.config();

const startWorker = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Worker DB Connected");

    const connection = await amqp.connect("amqp://localhost");
    const channel = await connection.createChannel();

    await channel.assertQueue("jobQueue");

    console.log("Worker Waiting For Jobs...");

    channel.consume("jobQueue", async (msg) => {
      const job = JSON.parse(msg.content.toString());

      console.log("Processing Job:", job._id);

      try {
        await Job.findByIdAndUpdate(job._id, {
          status: "processing",
        });

        const success = Math.random() > 0.3;

        await new Promise((resolve) => setTimeout(resolve, 2000));

        if (!success) {
          throw new Error("Random Job Failure");
        }

        await Job.findByIdAndUpdate(job._id, {
          status: "completed",
        });

        console.log("Job Completed:", job._id);

        channel.ack(msg);

      } catch (err) {
        console.log("Job Failed:", job._id);

        const jobFromDB = await Job.findById(job._id);

        const retries = jobFromDB.retries || 0;

        if (retries < 3) {
          console.log("Retrying Job:", job._id);

          await Job.findByIdAndUpdate(job._id, {
            status: "pending",
            retries: retries + 1,
          });

          channel.sendToQueue(
            "jobQueue",
            Buffer.from(JSON.stringify(job))
          );

        } else {
          console.log("Job Permanently Failed:", job._id);

          await Job.findByIdAndUpdate(job._id, {
            status: "failed",
          });
        }

        channel.ack(msg);
      }
    });

  } catch (error) {
    console.error("Worker Error:", error);
  }
};

startWorker();