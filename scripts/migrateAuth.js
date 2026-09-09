// One-off migration script: adds authentication support to an EXISTING
// database without dropping any tables (schema.sql itself would drop and
// recreate everything, which we don't want to run against real data).
//
// Safe to run more than once: the ALTER TABLE uses IF NOT EXISTS, and
// passwords are only generated for users that don't already have one.
//
// Usage: npm run auth:migrate
import bcrypt from "bcryptjs";
import pgclient from "../db.js";

const ADMIN_EMAIL = "admin@aqarjo.jo";
const DEFAULT_ADMIN_PASSWORD = "Admin123!";
const DEFAULT_USER_PASSWORD = "User123!";

async function migrateAuth() {
  try {
    console.log("Adding password_hash column to users (if it doesn't exist yet)...");
    await pgclient.query(
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)"
    );

    // Only touch users that don't have a password yet, so re-running this
    // script never overwrites a real password someone already set.
    const result = await pgclient.query(
      "SELECT id, email FROM users WHERE password_hash IS NULL"
    );

    if (result.rows.length === 0) {
      console.log("Every user already has a password_hash. Nothing to do.");
      return;
    }

    for (const user of result.rows) {
      const defaultPassword =
        user.email === ADMIN_EMAIL ? DEFAULT_ADMIN_PASSWORD : DEFAULT_USER_PASSWORD;

      const passwordHash = await bcrypt.hash(defaultPassword, 10);

      await pgclient.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
        passwordHash,
        user.id,
      ]);

      console.log(`Set a development password for user id ${user.id} (${user.email})`);
    }

    console.log("Auth migration complete.");
  } catch (err) {
    console.log(err);
  } finally {
    await pgclient.end();
  }
}

migrateAuth();
