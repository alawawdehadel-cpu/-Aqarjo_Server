// Handles the connection to our PostgreSQL database.
// We use a "Pool" from the pg package, which manages a small group of
// reusable connections instead of opening a new one for every query.
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

const pgclient = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

export default pgclient;
