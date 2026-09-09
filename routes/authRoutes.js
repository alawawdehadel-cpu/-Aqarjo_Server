import express from "express";
import bcrypt from "bcryptjs";
import pgclient from "../db.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// Columns that are safe to send back to the browser. password_hash is
// never included in any response.
const SAFE_USER_COLUMNS = "id, name, email, phone, role, created_at";

// Create an account, hash the password, and log the new user in right away.
router.post("/register", async (req, res) => {
  try {
    let { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required" });
    }

    name = name.trim();
    email = email.trim().toLowerCase();
    password = password.trim();

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const existingUser = await pgclient.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    // The public register form can never create an admin account, no
    // matter what the request body contains — role is always "user" here.
    const role = "user";
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pgclient.query(
      `INSERT INTO users (name, email, phone, role, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${SAFE_USER_COLUMNS}`,
      [name, email, phone, role, passwordHash]
    );

    const newUser = result.rows[0];

    // Log the user in immediately by storing their id in the session.
    req.session.userId = newUser.id;

    res.status(201).json(newUser);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Check the email/password and start a session.
router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    email = email.trim().toLowerCase();

    const result = await pgclient.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];

    // One generic error for "no such user" and "wrong password", so a
    // caller can't use this endpoint to find out which emails are registered.
    if (!user || !user.password_hash) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    req.session.userId = user.id;

    res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      created_at: user.created_at,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Returns the currently logged-in user, based on the session cookie.
// requireAuth already handles the "not logged in" (401) case.
router.get("/me", requireAuth, (req, res) => {
  res.status(200).json(req.user);
});

// Ends the session and clears the session cookie.
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: "Server error" });
    }
    res.clearCookie("aqarjo.sid");
    res.status(200).json({ message: "Logged out successfully" });
  });
});

export default router;
