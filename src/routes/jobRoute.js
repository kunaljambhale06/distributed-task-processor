import express from "express";

import {
  createJob,
  getJobs,
  getJobStats,
  getQueueStats,
  resetSystem,
  clearFailed,
  addJob,
  uploadJob,
  getWorkers
} from "../controllers/jobController.js";

import upload from "../config/multer.js";
import adminAuth from "../middleware/adminAuth.js";


const router = express.Router();

router.post("/", createJob);
router.post("/add", addJob);
router.post("/upload", upload.single("image"), uploadJob);
router.get("/", getJobs);

router.get("/stats", getJobStats);

router.get("/queue-stats", getQueueStats);

router.post("/admin/reset", adminAuth ,resetSystem);

router.post("/clear-failed", adminAuth, clearFailed);

router.get("/workers", getWorkers);

export default router;