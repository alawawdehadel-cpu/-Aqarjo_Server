# Final Integration

This document summarizes the complete AqarJo backend and how it integrates
with the database and the frontend, including deployment.

## Complete feature set

- **Setup**: Express server, ES modules, dotenv-based configuration.
- **Database**: PostgreSQL (`pg` Pool), 4 tables (`users`, `properties`,
  `favorites`, `inquiries`) with foreign-key relationships.
- **API**: full CRUD for properties, favorites, users, and inquiries, plus
  a third-party location lookup endpoint.
- **Authentication**: session-based login/register/logout, bcrypt password
  hashing, `requireAuth`/`requireAdmin` middleware enforcing ownership and
  admin-only access on every protected route.
- **Third-party integration**: `GET /api/location` calls the OpenStreetMap
  Nominatim API server-side (never from the browser), with an in-memory
  cache to avoid repeating identical geocoding requests.

## How the pieces connect

```
React (Vite)
  → fetch(..., { credentials: "include" })
  → Express (server.js: json + cors + session middleware)
  → routes/*.js (auth check via middleware/authMiddleware.js)
  → db.js (pg Pool, parameterized queries)
  → PostgreSQL
```

- CORS is configured with `origin: CLIENT_URL, credentials: true`, so the
  browser is allowed to send the session cookie cross-origin.
- The frontend never talks to PostgreSQL or Nominatim directly — every
  request goes through this Express API.

## Deployment (Railway)

The backend is deployed on Railway as its own service, alongside the
frontend (`Aqarjo_Client`) and a managed `Postgres` database, all within
the same Railway project.

- The backend connects to Railway's Postgres using `DB_USER`, `DB_HOST`
  (Railway's private `*.railway.internal` hostname), `DB_NAME`,
  `DB_PASSWORD`, `DB_PORT` — the same variable names `db.js` already
  expects locally, just pointed at the managed database instead of
  localhost.
- `schema.sql` was run once against the fresh Railway database to create
  the tables and seed data; `npm run auth:migrate` was then run once to
  generate development passwords for the seeded users.
- `CLIENT_URL` is set to the deployed frontend's Railway URL so CORS
  allows it.
- `SESSION_SECRET` and `NODE_ENV=production` are set as Railway service
  variables (never committed to the repo).

## Environment variables (see `.env.example`)

```
PORT
DB_USER, DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT
CLIENT_URL
SESSION_SECRET
NODE_ENV
```

## Related documentation

- `docs/01-setup.md` — initial project setup
- `docs/02-database.md` — schema and relationships
- `docs/03-api.md` — full endpoint reference
- `docs/04-authentication.md` — auth flow and middleware
