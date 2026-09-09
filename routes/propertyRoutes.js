import express from "express";
import pgclient from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Selected columns, aliased to camelCase and joined with users so the
// React frontend gets the same field names it already expects.
const SELECT_PROPERTY = `
  SELECT
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
  FROM properties p
  LEFT JOIN users u ON p.owner_id = u.id
`;

// Get all properties (public — anyone can browse listings)
router.get("/", async (req, res) => {
  try {
    const result = await pgclient.query(`${SELECT_PROPERTY} ORDER BY p.id DESC`);
    res.status(200).json(result.rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get the logged-in user's own properties (used by "My Properties").
// This route must come before "/:id" so Express does not treat "mine"
// as an id value. The owner comes from the session, never from the URL
// or the request body, so a user can only ever see their own listings here.
router.get("/mine", requireAuth, async (req, res) => {
  try {
    const result = await pgclient.query(
      `${SELECT_PROPERTY} WHERE p.owner_id = $1 ORDER BY p.id DESC`,
      [req.user.id]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get one property by id (public)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Simple view counter: every time the details page is opened, add 1.
    await pgclient.query("UPDATE properties SET views = views + 1 WHERE id = $1", [id]);

    const result = await pgclient.query(`${SELECT_PROPERTY} WHERE p.id = $1`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Property not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Create a new property (must be logged in)
router.post("/", requireAuth, async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      listingType,
      propertyType,
      city,
      area,
      bedrooms,
      bathrooms,
      size,
      image,
    } = req.body;

    // The owner is always the logged-in user — we never trust an ownerId
    // sent from the frontend.
    const ownerId = req.user.id;

    const result = await pgclient.query(
      `INSERT INTO properties
        (title, description, price, listing_type, property_type, city, area, bedrooms, bathrooms, size, image_url, owner_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id`,
      [
        title,
        description,
        price,
        listingType,
        propertyType,
        city,
        area,
        propertyType === "land" ? null : bedrooms,
        propertyType === "land" ? null : bathrooms,
        size,
        image,
        ownerId,
      ]
    );

    const newPropertyId = result.rows[0].id;
    const newProperty = await pgclient.query(`${SELECT_PROPERTY} WHERE p.id = $1`, [newPropertyId]);

    res.status(201).json(newProperty.rows[0]);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Update an existing property (owner or admin only)
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pgclient.query("SELECT owner_id FROM properties WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Property not found" });
    }

    const isOwner = existing.rows[0].owner_id === req.user.id;
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ error: "You can only edit your own properties" });
    }

    const {
      title,
      description,
      price,
      listingType,
      propertyType,
      city,
      area,
      bedrooms,
      bathrooms,
      size,
      image,
    } = req.body;

    await pgclient.query(
      `UPDATE properties SET
        title = $1,
        description = $2,
        price = $3,
        listing_type = $4,
        property_type = $5,
        city = $6,
        area = $7,
        bedrooms = $8,
        bathrooms = $9,
        size = $10,
        image_url = $11
       WHERE id = $12`,
      [
        title,
        description,
        price,
        listingType,
        propertyType,
        city,
        area,
        propertyType === "land" ? null : bedrooms,
        propertyType === "land" ? null : bathrooms,
        size,
        image,
        id,
      ]
    );

    const updatedProperty = await pgclient.query(`${SELECT_PROPERTY} WHERE p.id = $1`, [id]);
    res.status(200).json(updatedProperty.rows[0]);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Update only the status column (Admin Dashboard approve/reject — admin only)
router.put("/:id/status", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pgclient.query(
      "UPDATE properties SET status = $1 WHERE id = $2 RETURNING id",
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Property not found" });
    }

    const updatedProperty = await pgclient.query(`${SELECT_PROPERTY} WHERE p.id = $1`, [id]);
    res.status(200).json(updatedProperty.rows[0]);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete a property (owner or admin only)
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pgclient.query("SELECT owner_id FROM properties WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Property not found" });
    }

    const isOwner = existing.rows[0].owner_id === req.user.id;
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ error: "You can only delete your own properties" });
    }

    await pgclient.query("DELETE FROM properties WHERE id = $1", [id]);
    res.status(200).json({ message: "Property deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
