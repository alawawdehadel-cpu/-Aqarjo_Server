import express from "express";

const router = express.Router();

// A very simple in-memory cache: { "khalda-amman" => { latitude, ... } }.
// It lives only as long as the server process is running (no database,
// no Redis). This keeps the implementation course-level while still
// demonstrating a real efficiency improvement: once a city/area pair has
// been geocoded, we never ask Nominatim for it again during this run,
// which reduces repeated third-party requests and helps respect
// Nominatim's usage policy.
const locationCache = new Map();

const MAX_INPUT_LENGTH = 100;

// GET /api/location?area=Khalda&city=Amman
// Turns a property's area/city text into map coordinates using the
// OpenStreetMap Nominatim search API.
router.get("/", async (req, res) => {
  try {
    let { area, city } = req.query;

    area = typeof area === "string" ? area.trim() : "";
    city = typeof city === "string" ? city.trim() : "";

    if (!city) {
      return res.status(400).json({ error: "city is required" });
    }

    if (area.length > MAX_INPUT_LENGTH || city.length > MAX_INPUT_LENGTH) {
      return res.status(400).json({ error: "area/city is too long" });
    }

    const cacheKey = `${area.toLowerCase()}-${city.toLowerCase()}`;

    if (locationCache.has(cacheKey)) {
      return res.status(200).json(locationCache.get(cacheKey));
    }

    // Only the location text is sent to the third party — no user data,
    // no property id, nothing private.
    const searchText = area ? `${area}, ${city}, Jordan` : `${city}, Jordan`;

    const nominatimUrl =
      "https://nominatim.openstreetmap.org/search" +
      `?q=${encodeURIComponent(searchText)}` +
      "&format=jsonv2&limit=1&countrycodes=jo";

    let nominatimResponse;
    try {
      nominatimResponse = await fetch(nominatimUrl, {
        headers: {
          // Nominatim's usage policy requires a way to identify the app.
          "User-Agent": "AqarJo-University-Project/1.0",
          Accept: "application/json",
        },
      });
    } catch (err) {
      console.log(err);
      return res.status(502).json({ error: "Location service is temporarily unavailable" });
    }

    if (!nominatimResponse.ok) {
      return res.status(502).json({ error: "Location service is temporarily unavailable" });
    }

    const results = await nominatimResponse.json();

    if (!results || results.length === 0) {
      return res.status(404).json({ error: "Location not found" });
    }

    const match = results[0];

    const location = {
      latitude: Number(match.lat),
      longitude: Number(match.lon),
      displayName: match.display_name,
      source: "OpenStreetMap Nominatim",
    };

    locationCache.set(cacheKey, location);

    res.status(200).json(location);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
