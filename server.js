import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

// Simple test route to check the API is running
app.get("/api", (req, res) => {
  res.status(200).json({ message: "AqarJo API is running" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`AqarJo API server running on http://localhost:${PORT}`);
});
