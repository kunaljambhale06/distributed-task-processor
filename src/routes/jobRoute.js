import { Router } from "express";
import { createJob, getJobs, getJobStats, getQueueStats } from "../controllers/jobController.js";

const router = Router();

router.post("/", createJob);
router.get("/", getJobs); 
router.get("/stats", getJobStats); 
router.get("/queue-stats", getQueueStats); 

export default router;