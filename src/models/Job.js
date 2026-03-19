import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    name: String,

    status: {
      type: String,
      default: "pending",
    },

    retries: {
      type: Number,
      default: 0,
    },

    imagePath: {
      type: String,
      default: null,
    },

    processedImagePath: {
      type: String,
      default: null,
    },

    jobType: {
      type: String,
      default: "manual",
    },

    startedAt: Date,

    finishedAt: Date,

    workerId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Job", jobSchema);