import express from "express";
import pgclient from "../db.js";

const router = express.Router();

// Get all users
router.get("/", async (req, res) => {
  try {
    const result = await pgclient.query("SELECT * FROM users ORDER BY id");
    res.status(200).json(result.rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get one user by id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pgclient.query("SELECT * FROM users WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Create a new user
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, role } = req.body;

    const result = await pgclient.query(
      "INSERT INTO users (name, email, phone, role) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, email, phone, role || "user"]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Update an existing user
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role } = req.body;

    const result = await pgclient.query(
      "UPDATE users SET name = $1, email = $2, phone = $3, role = $4 WHERE id = $5 RETURNING *",
      [name, email, phone, role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete a user
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pgclient.query("DELETE FROM users WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ message: "User deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
