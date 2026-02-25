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

      //  Mark as processing
      await Job.findByIdAndUpdate(job._id, {
        status: "processing",
      });

      //  Simulate heavy work
      await new Promise((resolve) => setTimeout(resolve, 3000));

      //  Mark as completed
      await Job.findByIdAndUpdate(job._id, {
        status: "completed",
      });

      console.log("Job Completed:", job._id);

      channel.ack(msg);
    });
  } catch (err) {
    console.error(err);
  }
};

startWorker();