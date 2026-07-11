import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { globalErrorHandler } from "./middlewares/error.middleware.js";
import authRouter from './routes/auth.routes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRouter);
app.use(globalErrorHandler);

// Routes Placeholder (We will add routes here later)
app.get("/health", (req, res) => {
  res
    .status(200)
    .json({ status: "success", message: "GearUp Server is healthy!" });
});

// Global Error Handler
app.use(globalErrorHandler);

export default app;
