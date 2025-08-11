import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import assessmentRoutes from "./routes/assessmentRoutes.js";
import authRoutes from "./routes/auth.js";
import { authMiddleware } from "./middleware/authMiddleware.js";

dotenv.config();
const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie']
}));

app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

app.use(authMiddleware);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/auth", authRoutes);

export default app;