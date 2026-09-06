import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import userRoutes from "./routes/userRoutes.js";
import propertyRoutes from "./routes/propertyRoutes.js";
import favoriteRoutes from "./routes/favoriteRoutes.js";
import inquiryRoutes from "./routes/inquiryRoutes.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

// Simple test route to check the API is running
app.get("/api", (req, res) => {
  res.status(200).json({ message: "AqarJo API is running" });
});

app.use("/api/users", userRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/inquiries", inquiryRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`AqarJo API server running on http://localhost:${PORT}`);
});
