import amqp from "amqplib";
import mongoose from "mongoose";
import Job from "./src/models/Job.js";
import dotenv from "dotenv";

dotenv.config();

const QUEUE = "jobQueue";
const DLQ = "failed_jobs";

const startWorker = async () => {
  try {
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Worker DB Connected");

    
    const connection = await amqp.connect("amqp://localhost");
    const channel = await connection.createChannel();

    // main queue with DLX
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
      const jobId = jobData._id;

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

        await new Promise((r) => setTimeout(r, 1000));

        const success = Math.random() > 0.3;

        if (!success) throw new Error("Fail");

        await Job.findByIdAndUpdate(jobId, {
          status: "completed",
        });

        console.log("Completed:", jobId);

        channel.ack(msg); // Success

      } catch (err) {
        const jobFromDB = await Job.findById(jobId);

        const retries = jobFromDB.retries || 0;

        if (retries >= 3) {
          console.log("Send to DLQ:", jobId);

          await Job.findByIdAndUpdate(jobId, {
            status: "failed",
          });

          // send to DLQ automatically
          channel.nack(msg, false, false);

        } else {
          console.log("Retry:", retries + 1);

          await Job.findByIdAndUpdate(jobId, {
            retries: retries + 1,
            status: "pending",
          });

          // requeue
          channel.nack(msg, false, true);
        }
      }
    });

  } catch (err) {
    console.error(err);
  }
};

startWorker();