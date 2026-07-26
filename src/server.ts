import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import mainRouter from "./routes/index";
import { globalErrorHandler } from "./middlewares/error.middleware";

dotenv.config();

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get("/", (req: Request, res: Response) => {
  res.send("GearUp Running Successful");
});

app.use("/api", mainRouter);
app.use(globalErrorHandler);

const PORT: number | string = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});