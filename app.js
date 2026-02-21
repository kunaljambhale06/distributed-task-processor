import express from "express";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js"; 

dotenv.config();

const app = express();

app.use(express.json());

connectDB();

app.get("/", (req, res) => {
    res.send("API Running ");
});

const PORT = 5000;

app.listen(PORT, () =>
    console.log(` Server running on port ${PORT}`)
);