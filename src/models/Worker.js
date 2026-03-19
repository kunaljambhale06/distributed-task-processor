import mongoose from "mongoose";

const workerSchema = new mongoose.Schema({
  workerId: String,
  lastSeen: Date,
});

export default mongoose.model("Worker", workerSchema);