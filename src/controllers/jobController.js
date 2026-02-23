import Job from "../models/Job.js";
import { sendToQueue } from "../queues/jobProducer.js";

export const createJob = async (req, res) => {
    try {
        const { type, inputData } = req.body;

        const job = await Job.create({
            type,
            inputData,
            status: "queued"
        });

        sendToQueue({
            jobId: job._id,
            type: job.type,
            inputData: job.inputData
        });

        res.json({
            success: true,
            job
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Job creation failed" });
    }
};