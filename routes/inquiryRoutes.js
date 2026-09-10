import express from "express";
import pgclient from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all inquiries — admin only (this is a list of everyone's contact info).
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await pgclient.query(
      "SELECT * FROM inquiries ORDER BY created_at DESC"
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get one inquiry by id — admin only.
router.get("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pgclient.query("SELECT * FROM inquiries WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Inquiry not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Create a new inquiry (sent from the Property Details form) — stays public,
// since a visitor doesn't need an account to contact a property owner.
router.post("/", async (req, res) => {
  try {
    const { propertyId, name, email, message } = req.body;

    const result = await pgclient.query(
      `INSERT INTO inquiries (property_id, name, email, message)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [propertyId, name, email, message]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
