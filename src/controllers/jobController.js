import Job from "../models/Job.js";
import { sendToQueue } from "../config/rabbitmq.js";

export const createJob = async (req, res) => {
  try {
    const job = await Job.create(req.body);

    await sendToQueue(job);

    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};