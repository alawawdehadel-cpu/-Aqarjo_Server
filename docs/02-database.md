# Database

This document describes the PostgreSQL database used by the AqarJo backend.

## Connection

`db.js` creates a single `pg` `Pool`, configured from environment variables:

```
DB_USER
DB_HOST
DB_NAME
DB_PORT
DB_PASSWORD
```

Every route imports this same `pgclient` pool and calls `pgclient.query(...)`
with parameterized queries (`$1`, `$2`, ...) — no raw string interpolation
of user input.

## Schema (`schema.sql`)

Four tables:

### `users`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `SERIAL PRIMARY KEY` | |
| `name` | `VARCHAR(150)` | |
| `email` | `VARCHAR(150)` | `UNIQUE` |
| `phone` | `VARCHAR(30)` | |
| `role` | `VARCHAR(20)` | `'user'` or `'admin'`, defaults to `'user'` |
| `password_hash` | `VARCHAR(255)` | bcrypt hash, never the plain password |
| `created_at` | `TIMESTAMP` | |

### `properties`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `SERIAL PRIMARY KEY` | |
| `title`, `description` | text | |
| `price` | `NUMERIC(12,2)` | |
| `listing_type` | `VARCHAR(10)` | `'sale'` or `'rent'` |
| `property_type` | `VARCHAR(20)` | `'apartment'`, `'house'`, `'land'` |
| `city`, `area` | `VARCHAR` | |
| `bedrooms`, `bathrooms` | `INTEGER`, nullable | `NULL` for land |
| `size` | `NUMERIC(10,2)` | square meters |
| `image_url` | `TEXT` | |
| `status` | `VARCHAR(20)` | `'approved'`, `'pending'`, `'rejected'` |
| `featured` | `BOOLEAN` | |
| `views` | `INTEGER` | incremented on each detail view |
| `owner_id` | `INTEGER REFERENCES users(id)` | |
| `created_at` | `TIMESTAMP` | |

### `favorites`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `SERIAL PRIMARY KEY` | |
| `user_id` | `INTEGER REFERENCES users(id) ON DELETE CASCADE` | |
| `property_id` | `INTEGER REFERENCES properties(id) ON DELETE CASCADE` | |
| `created_at` | `TIMESTAMP` | |

`UNIQUE (user_id, property_id)` — a user can only favorite a property once.

### `inquiries`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `SERIAL PRIMARY KEY` | |
| `property_id` | `INTEGER REFERENCES properties(id) ON DELETE CASCADE` | |
| `name`, `email`, `message` | text | sent from the Property Details form |
| `created_at` | `TIMESTAMP` | |

## Relationships

```
users (1) ───< properties (owner_id)
users (many) ───< favorites >─── (many) properties
properties (1) ───< inquiries
```

## Seed data

`schema.sql` also inserts 7 users, 12 properties, 4 favorites, and 3
inquiries so the database has real data to demo immediately after setup.
