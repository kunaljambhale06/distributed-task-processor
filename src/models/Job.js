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
  },
  { timestamps: true }
);

export default mongoose.model("Job", jobSchema);