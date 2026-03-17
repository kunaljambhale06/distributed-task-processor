import Job from "../models/Job.js";
import { sendToQueue } from "../config/rabbitmq.js";
import amqp from "amqplib";
import { getChannel } from "../config/rabbitmq.js";


// ---------------- STATS ----------------

export const getJobStats = async (req, res) => {
  try {

    const total = await Job.countDocuments();
    const pending = await Job.countDocuments({ status: "pending" });
    const processing = await Job.countDocuments({ status: "processing" });
    const completed = await Job.countDocuments({ status: "completed" });
    const failed = await Job.countDocuments({ status: "failed" });

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



// ---------------- QUEUE STATS ----------------

export const getQueueStats = async (req, res) => {
  try {

    const connection = await amqp.connect("amqp://localhost");
    const channel = await connection.createChannel();

    // DO NOT assert queue here
    const jobQueue = await channel.checkQueue("jobQueue");
    const failedQueue = await channel.checkQueue("failed_jobs");

    await channel.close();
    await connection.close();

    res.json({
      jobQueue: jobQueue.messageCount,
      failed_jobs: failedQueue.messageCount,
    });

  } catch (err) {

    res.json({
      jobQueue: 0,
      failed_jobs: 0,
    });

  }
};



// ---------------- CREATE ----------------

export const createJob = async (req, res) => {
  try {

    const job = await Job.create({
    name: file.originalname,
    status: "pending",
    retries: 0,
    imagePath: file.path,
    jobType: "image",
    })
    await sendToQueue(job);

    res.json(job);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// ---------------- GET ----------------

export const getJobs = async (req, res) => {
  try {

    const jobs = await Job.find().sort({ createdAt: -1 });

    res.json(jobs);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// ---------------- CLEAR FAILED ----------------

export const clearFailed = async (req, res) => {
  try {
    await Job.deleteMany({ status: "failed" });

    res.json({
      message: "Failed jobs cleared",
    });

  } catch (err) {
    res.status(500).json({
      message: "Error",
    });
  }
};



// ---------------- RESET ----------------

export const resetSystem = async (req, res) => {
  try {

    const connection = await amqp.connect("amqp://localhost");
    const channel = await connection.createChannel();

    await channel.purgeQueue("jobQueue");
    await channel.purgeQueue("failed_jobs");

    await Job.deleteMany({});

    await channel.close();
    await connection.close();

    res.json({ message: "reset done" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const uploadJob = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    const job = await Job.create({
      name: file.originalname,
      status: "pending",
      imagePath: file.path,
      jobType: "image"
    });

    const channel = getChannel();

    channel.sendToQueue(
      "jobQueue",
      Buffer.from(
        JSON.stringify({
          _id: job._id,
        })
      ),
      { persistent: true }
    );

    res.json({
      message: "Image job added",
      job,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Upload failed",
    });
  }
};

export const addJob = async (req, res) => {
  try {
    const job = await Job.create({
      name: "Manual Job",
      status: "pending",
      jobType: "manual"
    });

    const channel = getChannel();

    channel.sendToQueue(
      "jobQueue",
      Buffer.from(
        JSON.stringify({
          jobId: job._id,
        })
      ),
      { persistent: true }
    );

    res.json(job);
  } catch (err) {
    res.status(500).json({ message: "Error" });
  }
};