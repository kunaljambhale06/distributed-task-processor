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

    await channel.assertQueue("jobs", {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": "",
        "x-dead-letter-routing-key": "failed_jobs"
      }
    });

    await channel.assertQueue("failed_jobs", {
      durable: true
    });

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

        if (job.retries >= 3) {
          job.status = "failed";
          await job.save();
          console.log("Job moved to DLQ:", job._id);
          channel.nack(msg, false, false);
          // false = don't requeue
          // RabbitMQ sends it to failed_jobs
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