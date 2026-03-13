import { Router } from "express";
import { createJob, getJobs, getJobStats } from "../controllers/jobController.js";

const router = Router();

router.post("/", createJob);
router.get("/", getJobs); 
router.get("/stats", getJobStats);  

export default router;