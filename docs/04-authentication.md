# Authentication

This document explains the register/login/session flow used by the AqarJo
backend.

## Method: session-based, not JWT

- Passwords are hashed with `bcryptjs` — the plain password is never
  stored, and `password_hash` is never returned to the frontend.
- `express-session` signs a session cookie named `aqarjo.sid` and sends it
  to the browser. The browser sends it back automatically on every later
  request (the frontend uses `credentials: "include"` on every fetch).
- The cookie is `httpOnly` (JavaScript in the browser can't read it),
  `sameSite: "none"` + `secure: true` in production, `"lax"` + `false` in
  development.

## Endpoints — `/api/auth`

| Method | URL | Purpose |
|--------|-----|---------|
| POST | `/register` | Create an account and log in immediately |
| POST | `/login` | Log in with email + password |
| GET | `/me` | Return the current logged-in user (`401` if not logged in) |
| POST | `/logout` | Destroy the session |

## Register flow

1. Validate `name`, `email`, `password` are present; `password` is at
   least 6 characters.
2. Normalize: trim strings, lowercase the email.
3. Reject if the email is already registered (`409`).
4. `role` is always forced to `"user"` — the public register form can
   never create an admin account, no matter what the request body
   contains.
5. Hash the password with `bcrypt.hash(password, 10)`.
6. Insert the user, store `req.session.userId = newUser.id`, return the
   safe user object (`id, name, email, phone, role, created_at`).

## Login flow

1. Look up the user by lowercased email.
2. Compare the password with `bcrypt.compare(password, user.password_hash)`.
3. If the user doesn't exist, has no password, or the password is wrong:
   respond `401` with one generic message (`"Invalid email or password"`)
   — this never reveals whether the email exists.
4. On success: `req.session.userId = user.id`, return the safe user
   object.

## Middleware — `middleware/authMiddleware.js`

- **`requireAuth`**: reads `req.session.userId`, loads that user from
  PostgreSQL (selecting only safe columns), and attaches it as `req.user`.
  Responds `401` if there's no session or the user no longer exists.
- **`requireAdmin`**: runs after `requireAuth`; checks
  `req.user.role === "admin"`, otherwise responds `403`.

## Authorization built on top of these

- Property create/update/delete: ownership is always resolved from
  `req.user.id` on the backend — an `ownerId` sent by the client is never
  trusted.
- Favorites always belong to `req.user.id`.
- Admin-only routes (`GET /api/users`, property status updates, viewing
  inquiries) use `requireAuth` + `requireAdmin` together.

## Development accounts

Seeded via `schema.sql` + `scripts/migrateAuth.js` (idempotent — only
fills in a password where one doesn't exist yet):

- Normal user: `omar.masri@mail.com` / `User123!`
- Admin: `admin@aqarjo.jo` / `Admin123!`
