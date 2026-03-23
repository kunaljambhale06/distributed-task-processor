import mongoose from "mongoose";

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/jobs");
        console.log(" MongoDB Connected");
    } catch (err) {
        console.error(" DB ERROR:", err);
        process.exit(1);
    }
};

export default connectDB; 