# Backend Setup

This document describes the initial setup stage of the AqarJo backend.

## Stack

- Node.js
- Express
- ES Modules (`"type": "module"` in `package.json`)
- dotenv (loads configuration from `.env`)
- nodemon (auto-restarts the server during development)

## Entry point

`server.js` is the application's entry point. It:

1. Creates the Express app.
2. Registers global middleware (`express.json()`, `cors`, `express-session`).
3. Exposes a simple health-check route:

   ```
   GET /api
   → { "message": "AqarJo API is running" }
   ```

4. Mounts each feature's routes under its own `/api/...` prefix.
5. Starts listening on `process.env.PORT` (defaults to `5000`).

## package.json scripts

| Script | Purpose |
|--------|---------|
| `npm start` | Run the server with plain `node` |
| `npm run dev` | Run the server with `nodemon` (auto-restart on file changes) |
| `npm run auth:migrate` | One-off script to add authentication support to an existing database |

## Environment variables

Configuration is read from `.env` (see `.env.example` for the full list) and
loaded via `dotenv.config()` at the top of `server.js`. `.env` itself is
git-ignored and never committed.

## Folder structure at this stage

```
aqairjo_server/
├── server.js
├── db.js
├── package.json
└── .env.example
```

Routes, the database schema, and authentication were added in later stages
of the project (see `docs/02-database.md`, `docs/03-api.md`, and
`docs/04-authentication.md`).
