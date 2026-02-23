import express from "express";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";
import { connectQueue } from "./src/queues/jobProducer.js";
import jobRoutes from "./src/routes/jobRoute.js";

dotenv.config();

const startServer = async () => {

    await connectDB();
    await connectQueue();

    const app = express();
    app.use(express.json());

    app.use("/jobs", jobRoutes);

    app.listen(5000, () =>
        console.log(" Server running on port 5000")
    );
};

startServer();