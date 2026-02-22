import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true
    },

    status: {
        type: String,
        enum: ["queued", "processing", "completed", "failed"],
        default: "queued"
    },

    inputData: Object,
    resultData: Object,

    attempts: {
        type: Number,
        default: 0
    }

}, { timestamps: true });

const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true
    },

    status: {
        type: String,
        enum: ["queued", "processing", "completed", "failed"],
        default: "queued"
    },

    inputData: Object,
    resultData: Object,

    attempts: {
        type: Number,
        default: 0
    }

}, { timestamps: true });

module.exports = mongoose.model("Job", jobSchema);