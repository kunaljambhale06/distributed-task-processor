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

    // Main Queue with DLQ configuration
    await channel.assertQueue("jobs", {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": "",
        "x-dead-letter-routing-key": "failed_jobs",
      },
    });

    // Dead Letter Queue
    await channel.assertQueue("failed_jobs", {
      durable: true,
    });

    console.log("Worker Waiting For Jobs...");

    // Consume Jobs
    channel.consume("jobs", async (msg) => {
      if (!msg) return;

      const jobData = JSON.parse(msg.content.toString());
      console.log("Processing Job:", jobData._id);

      try {
        // Mark job as processing
        await Job.findByIdAndUpdate(jobData._id, {
          status: "processing",
        });

        //  Force failure for testing (REMOVE LATER)
        throw new Error("Force fail");

        // Simulated processing delay
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Random success logic
        const success = Math.random() > 0.3;

        if (!success) {
          throw new Error("Random Job Failure");
        }

        // Mark as completed
        await Job.findByIdAndUpdate(jobData._id, {
          status: "completed",
        });

        console.log("Job Completed:", jobData._id);

        channel.ack(msg); // Success

      } catch (err) {
        console.log("Job Failed:", jobData._id);

        const jobFromDB = await Job.findById(jobData._id);
        const retries = jobFromDB?.retries || 0;

        if (retries >= 3) {
          //  Move to DLQ
          await Job.findByIdAndUpdate(jobData._id, {
            status: "failed",
          });

          console.log("Job moved to DLQ:", jobData._id);

          channel.nack(msg, false, false); //  Don't requeue → goes to DLQ
        } else {
          
          await Job.findByIdAndUpdate(jobData._id, {
            status: "pending",
            retries: retries + 1,
          });

          console.log(
            `Retrying Job ${jobData._id} (Attempt ${retries + 1})`
          );

          channel.nack(msg, false, true);
        }
      }
    });

  } catch (error) {
    console.error("Worker Error:", error);
  }
};

startWorker();