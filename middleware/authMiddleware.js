import pgclient from "../db.js";

// Runs before any route that needs a logged-in user.
// Reads the user id that /api/auth/login stored in the session, loads that
// user from PostgreSQL (never trusting anything the client sends), and
// attaches it to req.user so later route handlers can use it.
export async function requireAuth(req, res, next) {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const result = await pgclient.query(
      "SELECT id, name, email, phone, role, created_at FROM users WHERE id = $1",
      [req.session.userId]
    );

    if (result.rows.length === 0) {
      // The session points at a user that no longer exists.
      return res.status(401).json({ error: "Not authenticated" });
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
}

// Must run AFTER requireAuth, since it relies on req.user already being set.
export function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}
