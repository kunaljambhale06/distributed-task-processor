import express from "express";

import {
  createJob,
  getJobs,
  getJobStats,
  getQueueStats,
  resetSystem,
  clearFailed,
  retryFailed,
} from "../controllers/jobController.js";

const router = express.Router();

router.post("/", createJob);

router.get("/", getJobs);

router.get("/stats", getJobStats);

router.get("/queue-stats", getQueueStats);

router.post("/admin/reset", resetSystem);

router.post("/clear-failed", clearFailed);

router.post("/retry-failed", retryFailed);

export default router;