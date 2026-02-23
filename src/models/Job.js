import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    name: String,
    status: {
      type: String,
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Job", jobSchema);