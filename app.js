import express from "express";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";
import jobRoutes from "./src/routes/jobRoute.js";
import { connectQueue } from "./src/config/rabbitmq.js";
import cors from "cors";
import rateLimit from "express-rate-limit";
import path from "path";
import helmet from "helmet";


if (process.env.NODE_ENV !== "production") {
    dotenv.config();
}

const startServer = async () => {

    await connectDB();
    await connectQueue();
    const limiter = rateLimit({
        windowMs: 1000,
        max: 100,
    });

    const app = express();
    app.use(helmet());
    app.use(express.json());
    app.use(cors());

    app.use("/api/jobs", limiter);
    app.use("/api/jobs", jobRoutes);

    // app.use("/api/uploads", express.static("uploads"));
    // app.use("/api/processed", express.static("processed"));
    app.use(
        "/api/uploads",
        express.static(path.resolve("uploads"))
    );

    app.use(
        "/api/processed",
        express.static(path.resolve("processed"))
    );


    app.listen(5000, () =>
        console.log(" Server running on port 5000")
    );
};

startServer();