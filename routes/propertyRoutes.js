import express from "express";
import pgclient from "../db.js";

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

// Get all properties
router.get("/", async (req, res) => {
  try {
    const result = await pgclient.query(`${SELECT_PROPERTY} ORDER BY p.id DESC`);
    res.status(200).json(result.rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get properties belonging to one user (used by "My Properties" page).
// This route must come before "/:id" so Express does not treat "user"
// as an id value.
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pgclient.query(
      `${SELECT_PROPERTY} WHERE p.owner_id = $1 ORDER BY p.id DESC`,
      [userId]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get one property by id
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

// Create a new property
router.post("/", async (req, res) => {
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
      ownerId,
    } = req.body;

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

// Update an existing property
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
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

    const result = await pgclient.query(
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
       WHERE id = $12
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
        id,
      ]
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

// Update only the status column (used by the Admin Dashboard)
router.put("/:id/status", async (req, res) => {
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

// Delete a property
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pgclient.query("DELETE FROM properties WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Property not found" });
    }

    res.status(200).json({ message: "Property deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
