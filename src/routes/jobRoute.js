import express from "express";

import {
  createJob,
  getJobs,
  getJobStats,
  getQueueStats,
  resetSystem,
  clearFailed,
  addJob,
  uploadJob
} from "../controllers/jobController.js";

import upload from "../config/multer.js";


const router = express.Router();

router.post("/", createJob);
router.post("/add", addJob);
router.post("/upload", upload.single("image"), uploadJob);
router.get("/", getJobs);

router.get("/stats", getJobStats);

router.get("/queue-stats", getQueueStats);

router.post("/admin/reset", resetSystem);

router.post("/clear-failed", clearFailed);

router.get("/workers", getWorkers);

export default router;