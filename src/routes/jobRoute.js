import { Router } from "express";
import { createJob, getJobs } from "../controllers/jobController.js";

const router = Router();

router.post("/", createJob);
router.get("/", getJobs);   

export default router;