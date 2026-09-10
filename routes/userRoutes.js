import express from "express";
import pgclient from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Columns that are safe to send back to the browser. password_hash is
// deliberately never selected here.
const SAFE_USER_COLUMNS = "id, name, email, phone, role, created_at";

// Get all users — used by the Admin Dashboard, so admin only.
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await pgclient.query(
      `SELECT ${SAFE_USER_COLUMNS} FROM users ORDER BY id`
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get one user by id — the user themselves, or an admin.
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const isSelf = req.user.id === Number(id);

    if (!isSelf && req.user.role !== "admin") {
      return res.status(403).json({ error: "You can only view your own profile" });
    }

    const result = await pgclient.query(
      `SELECT ${SAFE_USER_COLUMNS} FROM users WHERE id = $1`,
      [id]
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

// Create a new user directly (without going through /api/auth/register).
// Admin only, so this can never be used to hand out an admin role.
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, email, phone, role } = req.body;

    const result = await pgclient.query(
      `INSERT INTO users (name, email, phone, role)
       VALUES ($1, $2, $3, $4)
       RETURNING ${SAFE_USER_COLUMNS}`,
      [name, email, phone, role || "user"]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Update an existing user — the user themselves, or an admin.
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const targetId = Number(id);
    const isSelf = req.user.id === targetId;
    const isAdmin = req.user.role === "admin";

    if (!isSelf && !isAdmin) {
      return res.status(403).json({ error: "You can only edit your own profile" });
    }

    const existing = await pgclient.query("SELECT role FROM users WHERE id = $1", [targetId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const { name, email, phone } = req.body;

    // Only an admin can change a role, and only when they actually send
    // one. A normal user updating their own profile always keeps their
    // current role, no matter what the request body contains.
    const role = isAdmin && req.body.role ? req.body.role : existing.rows[0].role;

    const result = await pgclient.query(
      `UPDATE users SET name = $1, email = $2, phone = $3, role = $4
       WHERE id = $5
       RETURNING ${SAFE_USER_COLUMNS}`,
      [name, email, phone, role, targetId]
    );

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete a user — admin only.
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pgclient.query("DELETE FROM users WHERE id = $1 RETURNING id", [id]);

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
