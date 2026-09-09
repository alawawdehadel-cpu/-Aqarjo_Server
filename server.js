import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import propertyRoutes from "./routes/propertyRoutes.js";
import favoriteRoutes from "./routes/favoriteRoutes.js";
import inquiryRoutes from "./routes/inquiryRoutes.js";

dotenv.config();

const app = express();

// Needed so secure cookies work correctly behind a proxy/load balancer
// in production (e.g. Render, Railway, Heroku).
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(express.json());

// credentials: true is required so the browser is allowed to send the
// session cookie along with requests from the React app.
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Session-based login: on successful login/register we store the user's id
// in req.session.userId. Express signs a session cookie and sends it to the
// browser; the browser sends it back on every request so we know who is
// making the request.
app.use(
  session({
    name: "aqarjo.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // JavaScript in the browser can't read this cookie
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Simple test route to check the API is running
app.get("/api", (req, res) => {
  res.status(200).json({ message: "AqarJo API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/inquiries", inquiryRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`AqarJo API server running on http://localhost:${PORT}`);
});
