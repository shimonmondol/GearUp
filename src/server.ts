import express from "express";
import mainRouter from "./routes/index";
import cors from "cors";
import dotenv from "dotenv";
import { globalErrorHandler } from "./middlewares/error.middleware"; // এক্সটেনশন .ts বাদ দেওয়া হয়েছে

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get("/", (req, res) => {
  res.send("GearUp Running Successful");
});

app.get("/api/categories", async (req, res) => {
  const prisma = await import("./config/prisma");
  const db: any = prisma;
  const categoryModel = db.category || db.Category;

  if (!categoryModel) {
    return res
      .status(500)
      .json({
        success: false,
        message: "Category model not found in Prisma client",
      });
  }

  const categories = await categoryModel.findMany();
  res.json({ success: true, data: categories });
});

app.use("/api", mainRouter);

app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
