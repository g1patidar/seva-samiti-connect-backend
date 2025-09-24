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
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8080"
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed =
      allowedOrigins.includes(origin) ||
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
      /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin);
    if (allowed) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
/* Preflight handled by CORS middleware */

app.use(express.json());

// Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "Backend is running ✅" });
});

// Import routes
import donationRoutes from "./routes/donationRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import announcementRoutes from "./routes/announcementRoutes.js";

// Use routes
app.use("/api/donations", donationRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/announcements", announcementRoutes);

import userRoutes from "./routes/userRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
// Debug logging for /api/users to verify requests reaching the backend
app.use("/api/users", (req, res, next) => {
  console.log("[/api/users] hit:", req.method, req.originalUrl);
  next();
}, userRoutes);
app.use("/api/contact", contactRoutes);

// Error handling middlewares
import { notFound, errorHandler } from "./middlewares/errorHandler.js";

// Serve static receipts
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/receipts", express.static(path.join(__dirname, "public/receipts")));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

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
