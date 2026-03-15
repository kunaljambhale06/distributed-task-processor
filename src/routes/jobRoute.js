import express from "express";

import {
  createJob,
  getJobs,
  getJobStats,
  getQueueStats,
  resetSystem,
  clearFailed
} from "../controllers/jobController.js";

const router = express.Router();

router.post("/", createJob);

router.get("/", getJobs);

router.get("/stats", getJobStats);

router.get("/queue-stats", getQueueStats);

router.post("/admin/reset", resetSystem);

router.post("/clear-failed", clearFailed);

export default router;