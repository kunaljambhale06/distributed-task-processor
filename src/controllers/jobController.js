import Job from "../models/Job.js";
import { sendToQueue } from "../config/rabbitmq.js";
import amqp from "amqplib";


export const getQueueStats = async (req, res) => {
  try {
    const connection = await amqp.connect("amqp://localhost");
    const channel = await connection.createChannel();

    const jobQueue = await channel.checkQueue("jobQueue");
    const failedQueue = await channel.checkQueue("failed_jobs");

    res.json({
      jobQueue: jobQueue.messageCount,
      failed_jobs: failedQueue.messageCount,
    });

    await channel.close();
    await connection.close();

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createJob = async (req, res) => {
  try {
    const job = await Job.create(req.body);

    await sendToQueue(job);

    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });

    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getJobStats = async (req, res) => {
  try {
    const total = await Job.countDocuments();

    const pending = await Job.countDocuments({
      status: "pending",
    });

    const processing = await Job.countDocuments({
      status: "processing",
    });

    const completed = await Job.countDocuments({
      status: "completed",
    });

    const failed = await Job.countDocuments({
      status: "failed",
    });

    res.json({
      total,
      pending,
      processing,
      completed,
      failed,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};