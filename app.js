import express from "express";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";
import jobRoutes from "./src/routes/jobRoute.js";
import { connectQueue } from "./src/config/rabbitmq.js";
import cors from "cors";
import rateLimit from "express-rate-limit";


dotenv.config();

const startServer = async () => {

    await connectDB();
    await connectQueue();
    const limiter = rateLimit({
        windowMs: 1000,
        max: 5,
    });

    const app = express();
    app.use(express.json());
    app.use(cors());

    app.use("/jobs", limiter);
    app.use("/jobs", jobRoutes);
    app.use("/uploads", express.static("uploads"));
    app.use("/processed", express.static("processed"));
    

    app.listen(5000, () =>
        console.log(" Server running on port 5000")
    );
};

startServer();