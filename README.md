# AqarJo Backend

Simple Node.js + Express + PostgreSQL backend for the AqarJo real estate
marketplace. It provides a REST API for authentication, properties, users,
favorites and inquiries, used by the `aqarjo_Client` React frontend.

## Technologies used

- Node.js
- Express (routing, middleware)
- PostgreSQL (database)
- pg (PostgreSQL client for Node.js)
- cors (allows the React app to call this API)
- dotenv (loads settings from a `.env` file)
- express-session (session-based login)
- bcryptjs (password hashing)
- nodemon (auto-restarts the server while developing)

## Folder structure

```
aqairjo_server/
├── routes/
│   ├── authRoutes.js       # /api/auth (register, login, me, logout)
│   ├── userRoutes.js       # /api/users
│   ├── propertyRoutes.js   # /api/properties
│   ├── favoriteRoutes.js   # /api/favorites
│   └── inquiryRoutes.js    # /api/inquiries
├── middleware/
│   └── authMiddleware.js    # requireAuth, requireAdmin
├── scripts/
│   └── migrateAuth.js        # adds password_hash + dev passwords to an existing DB
├── server.js                  # creates the Express app and starts the server
├── db.js                       # PostgreSQL connection (pg Pool)
├── schema.sql                   # creates tables + inserts sample data
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## 1. Install dependencies

```
cd aqairjo_server
npm install
```

## 2. Configure environment variables

Copy `.env.example` to `.env` and fill in your own values:

```
PORT=5000

DB_USER=postgres
DB_HOST=localhost
DB_NAME=aqarjo_db
DB_PASSWORD=your_postgres_password
DB_PORT=5432

CLIENT_URL=http://localhost:5173
SESSION_SECRET=replace_with_a_long_random_secret
NODE_ENV=development
```

`.env` is listed in `.gitignore` and is never committed. `SESSION_SECRET`
should be a long random string — it's used to sign the session cookie.

## 3. Create the PostgreSQL database

1. Open pgAdmin (or DBeaver).
2. Create a new database named `aqarjo_db`.
3. Open the Query Tool for `aqarjo_db`.
4. Open `schema.sql` from this folder.
5. Run it.
6. Verify the tables were created: `users`, `properties`, `favorites`, `inquiries`.

`schema.sql` also inserts sample users and about 12 sample properties
(reused from the frontend mock data) so the database has real data to
demo immediately. These seed users have no password yet.

## 4. Set up development passwords

Run the authentication migration once to add a `password_hash` column
(if it isn't there yet) and generate a development password for every
seed user that doesn't have one:

```
npm run auth:migrate
```

This is safe to run again later — it never overwrites a password that's
already set, and it never drops any table.

## 5. Start the backend

```
npm run dev
```

(or `npm start` to run without nodemon)

## 6. Test the API

Open a browser or Postman:

```
GET http://localhost:5000/api
GET http://localhost:5000/api/properties
```

## Authentication

- **Method:** session-based authentication (`express-session`), not JWT.
- **Password storage:** hashed with `bcryptjs` — the plain password is
  never stored, and `password_hash` is never sent to the frontend.
- **How it works:** on a successful login/register, the server stores the
  user's id in `req.session.userId`. Express signs a session cookie
  (`aqarjo.sid`) and sends it to the browser; the browser automatically
  sends it back on every later request, so the server knows who's asking.
  `requireAuth` (in `middleware/authMiddleware.js`) reads that session id,
  loads the user from PostgreSQL, and attaches it as `req.user`.
  `requireAdmin` then checks `req.user.role === "admin"`.

### Auth endpoints

| Method | URL | Purpose |
|--------|-----|---------|
| POST | /api/auth/register | Create an account (always role `user`) and log in |
| POST | /api/auth/login | Log in with email + password |
| GET | /api/auth/me | Get the current logged-in user (401 if not logged in) |
| POST | /api/auth/logout | Destroy the session |

### Development demo accounts

Normal user:
```
omar.masri@mail.com
User123!
```

Admin:
```
admin@aqarjo.jo
Admin123!
```

(Every other seeded user also has the password `User123!` after running
`npm run auth:migrate`.)

## How frontend connects to backend

The React app (`aqarjo_Client`) runs on `http://localhost:5173` (Vite) and
calls this API on `http://localhost:5000` using the Fetch API with
`credentials: "include"` on every request, so the session cookie is sent
along. `cors` is configured with `origin: CLIENT_URL, credentials: true`
so the browser allows this. See `src/api/api.ts` in the client project.

## API Endpoints

### Properties - `/api/properties`

| Method | URL | Auth | Purpose | Example body |
|--------|-----|------|---------|--------------|
| GET | /api/properties | public | Get all properties | - |
| GET | /api/properties/mine | logged in | Get the current user's own properties | - |
| GET | /api/properties/:id | public | Get one property (also increments views) | - |
| POST | /api/properties | logged in | Create a property (owner = session user) | `{ "title": "...", "description": "...", "price": 85000, "listingType": "sale", "propertyType": "apartment", "city": "Amman", "area": "Khalda", "bedrooms": 3, "bathrooms": 2, "size": 150, "image": "https://..." }` |
| PUT | /api/properties/:id | owner or admin | Update a property | same as POST |
| PUT | /api/properties/:id/status | admin | Approve/reject a property | `{ "status": "approved" }` |
| DELETE | /api/properties/:id | owner or admin | Delete a property | - |

### Favorites - `/api/favorites` (all require login; always the session user)

| Method | URL | Purpose | Example body |
|--------|-----|---------|--------------|
| GET | /api/favorites | Get the logged-in user's favorited properties | - |
| POST | /api/favorites | Add a property to favorites | `{ "propertyId": 3 }` |
| DELETE | /api/favorites/:propertyId | Remove a property from favorites | - |

### Users - `/api/users`

| Method | URL | Auth | Purpose | Example body |
|--------|-----|------|---------|--------------|
| GET | /api/users | admin | Get all users | - |
| GET | /api/users/:id | self or admin | Get one user | - |
| POST | /api/users | admin | Create a user directly | `{ "name": "Ahmad Ali", "email": "ahmad@email.com", "phone": "0790000000", "role": "user" }` |
| PUT | /api/users/:id | self or admin | Update a user (only admin can change `role`) | `{ "name": "...", "email": "...", "phone": "..." }` |
| DELETE | /api/users/:id | admin | Delete a user | - |

### Inquiries - `/api/inquiries`

| Method | URL | Auth | Purpose | Example body |
|--------|-----|------|---------|--------------|
| GET | /api/inquiries | admin | Get all inquiries | - |
| GET | /api/inquiries/:id | admin | Get one inquiry | - |
| POST | /api/inquiries | public | Send a new inquiry from the Property Details page | `{ "propertyId": 2, "name": "Adel", "email": "adel@email.com", "message": "I am interested in this property." }` |

## Notes

- Property JSON responses use camelCase field names (`listingType`,
  `propertyType`, `ownerId`, `dateAdded`, ...) even though the database
  columns are snake_case (`listing_type`, `property_type`, `owner_id`,
  `created_at`, ...), using simple SQL aliases in the `SELECT` queries.
- `price` and `size` are cast with `::float` so they come back as JSON
  numbers instead of strings.
- Ownership is always resolved on the backend from the session
  (`req.user.id`) — an `ownerId`/`userId` sent from the frontend is never
  trusted for who owns what.
