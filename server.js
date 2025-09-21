// Basic Express server setup
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const app = express();

// Middleware
const allowedOrigins = [
  "https://seva-samiti-connect-frontend.vercel.app",
  "http://localhost:3000"
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
);

app.use(express.json());

// Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "Backend is running ✅" });
});

// Import routes
import donationRoutes from "./routes/donationRoutes.js";

// Use routes
app.use("/api/donations", donationRoutes);

import userRoutes from "./routes/userRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
app.use("/api/users", userRoutes);
app.use("/api/contact", contactRoutes);

// Error handling middlewares
import { notFound, errorHandler } from "./middlewares/errorHandler.js";

// Serve static receipts
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/receipts", express.static(path.join(__dirname, "public/receipts")));

// 404 and error handlers
app.use(notFound);
app.use(errorHandler);

/* MongoDB connect and then start server */
const start = async () => {
  try {
    const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/seva-samiti";
    await mongoose.connect(uri);
    console.log("✅ MongoDB connected");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message || err);
    process.exit(1);
  }
};

start();
