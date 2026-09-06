import express from "express";
import pgclient from "../db.js";

const router = express.Router();

// Get the favorited properties for one user.
// Joins favorites -> properties so the frontend gets full property objects,
// the same shape PropertyCard already expects.
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pgclient.query(
      `SELECT
        p.id,
        p.title,
        p.description,
        p.price::float AS price,
        p.listing_type AS "listingType",
        p.property_type AS "propertyType",
        p.city,
        p.area,
        p.bedrooms,
        p.bathrooms,
        p.size::float AS size,
        p.image_url AS image,
        p.status,
        p.featured,
        p.views,
        p.owner_id AS "ownerId",
        u.name AS owner,
        p.created_at AS "dateAdded"
      FROM favorites f
      JOIN properties p ON f.property_id = p.id
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE f.user_id = $1
      ORDER BY f.id DESC`,
      [userId]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Add a property to a user's favorites
router.post("/", async (req, res) => {
  try {
    const { userId, propertyId } = req.body;

    const result = await pgclient.query(
      `INSERT INTO favorites (user_id, property_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, property_id) DO NOTHING
       RETURNING *`,
      [userId, propertyId]
    );

    res.status(201).json(result.rows[0] || { message: "Already favorited" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Remove a property from a user's favorites
router.delete("/:userId/:propertyId", async (req, res) => {
  try {
    const { userId, propertyId } = req.params;

    const result = await pgclient.query(
      "DELETE FROM favorites WHERE user_id = $1 AND property_id = $2 RETURNING *",
      [userId, propertyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Favorite not found" });
    }

    res.status(200).json({ message: "Removed from favorites" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
