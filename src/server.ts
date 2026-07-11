import express from "express";
import mainRouter from './routes/index';
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes.ts"; 
import { globalErrorHandler } from "./middlewares/error.middleware.ts";

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use('/api', mainRouter);

app.get("/", (req, res) => {
  res.send("GearUp Running Successful");
});

// Routes
app.use("/api/auth", authRoutes);

// Global Error Handler
app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});