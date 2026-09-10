# 🧠 AqarJo Backend (Express + PostgreSQL)

> The backend for the AqarJo real-estate marketplace — a REST API for
> authentication, properties, favorites, users, inquiries, and property
> location services.

## 🏗 Tech Stack

- Node.js
- Express
- PostgreSQL
- pg
- dotenv
- cors
- express-session
- bcryptjs
- nodemon
- Built-in Fetch API (used to call OpenStreetMap Nominatim — no Axios)

## 🚀 Getting Started

1. Install dependencies:

```
cd aqairjo_server
npm install
```

2. Create a PostgreSQL database named `aqarjo_db`.

3. Configure environment variables using `.env.example` (copy it to `.env`
   and fill in your own values).

4. Load the schema — either open `schema.sql` in pgAdmin's Query Tool, or:

```
psql -U postgres -d aqarjo_db -f schema.sql
```

> ⚠️ **Warning:** `schema.sql` contains `DROP TABLE` statements. It is
> intended for a **fresh** database setup and recreates the tables. Do
> **not** rerun it on a database that already has data you want to keep.

5. Initialize development authentication passwords:

```
npm run auth:migrate
```

`scripts/migrateAuth.js` is safe to run more than once — it only adds a
`password_hash` column if missing and only fills it in for users that
don't have one yet. It never drops tables.

6. Start the backend:

```
npm run dev
```

The API runs at `http://localhost:5000`.

## 📁 Project Structure

```
aqairjo_server/
├── routes/
│   ├── authRoutes.js       # /api/auth
│   ├── userRoutes.js       # /api/users
│   ├── propertyRoutes.js   # /api/properties
│   ├── favoriteRoutes.js   # /api/favorites
│   ├── inquiryRoutes.js    # /api/inquiries
│   └── locationRoutes.js   # /api/location (Nominatim geocoding)
├── middleware/
│   └── authMiddleware.js    # requireAuth, requireAdmin
├── scripts/
│   └── migrateAuth.js        # adds password_hash + dev passwords, idempotent
├── server.js                  # Express app, middleware, route mounting
├── db.js                       # PostgreSQL connection (pg Pool)
├── schema.sql                   # table definitions + seed data
├── .env.example
├── package.json
└── README.md
```

## 🗄 Database

Four tables: `users`, `properties`, `favorites`, `inquiries`.

- **users → properties**: one user can own many properties (`owner_id`).
- **users ↔ properties (favorites)**: many-to-many, through the
  `favorites` join table.
- **properties → inquiries**: one property can receive many inquiries.

`users` also holds `password_hash` (bcrypt), used for authentication.

## 📡 API Endpoints

The API runs on `http://localhost:5000`.

### 🔐 Auth Routes

Base URL: `/api/auth`

| Method | URL | Purpose |
|--------|-----|---------|
| POST | `/register` | Register a new user and create a session |
| POST | `/login` | Login an existing user |
| GET | `/me` | Return the current logged-in user |
| POST | `/logout` | Destroy the current session |

Register example (public registration always creates `role: "user"` —
`role` is never accepted from the request body):

```json
{
  "name": "Adel Ahmad",
  "email": "adel@example.com",
  "phone": "0790000000",
  "password": "123456"
}
```

Login example:

```json
{
  "email": "adel@example.com",
  "password": "123456"
}
```

### 🏠 Property Routes

Base URL: `/api/properties`

| Method | URL | Access | Purpose |
|--------|-----|--------|---------|
| GET | `/` | public | Get all properties |
| GET | `/mine` | authenticated | Get the current user's properties |
| GET | `/:id` | public | Get property details |
| POST | `/` | authenticated | Create a property |
| PUT | `/:id` | owner/admin | Update a property |
| PUT | `/:id/status` | admin | Approve/reject a property |
| DELETE | `/:id` | owner/admin | Delete a property |

Create example:

```json
{
  "title": "Modern Apartment for Sale in Khalda",
  "description": "A bright third-floor apartment...",
  "price": 85000,
  "listingType": "sale",
  "propertyType": "apartment",
  "city": "Amman",
  "area": "Khalda",
  "bedrooms": 3,
  "bathrooms": 2,
  "size": 150,
  "image": "https://..."
}
```

There is no `ownerId` in the request body — `owner_id` is always
determined from the authenticated session user (`req.user.id`).

### ❤️ Favorite Routes

Base URL: `/api/favorites`

| Method | URL | Access | Purpose |
|--------|-----|--------|---------|
| GET | `/` | authenticated | Get the current user's favorites |
| POST | `/` | authenticated | Add a favorite |
| DELETE | `/:propertyId` | authenticated | Remove a favorite |

```json
{ "propertyId": 3 }
```

There is no `userId` in the request — favorites always belong to the
logged-in session user.

### 👥 User Routes

Base URL: `/api/users`

| Method | URL | Access |
|--------|-----|--------|
| GET | `/` | admin |
| GET | `/:id` | self or admin |
| POST | `/` | admin |
| PUT | `/:id` | self or admin |
| DELETE | `/:id` | admin |

A normal user updating their own profile cannot change their own `role` —
only an admin can change a role.

### ✉️ Inquiry Routes

Base URL: `/api/inquiries`

| Method | URL | Access |
|--------|-----|--------|
| GET | `/` | admin |
| GET | `/:id` | admin |
| POST | `/` | public |

```json
{
  "propertyId": 2,
  "name": "Adel",
  "email": "adel@email.com",
  "message": "I am interested in this property."
}
```

### 🗺 Location Route

Base URL: `/api/location`

```
GET /api/location?area=Khalda&city=Amman
```

- Public endpoint (no login required).
- `city` is required; `area` is optional.
- Calls the OpenStreetMap Nominatim API to geocode the text.
- Returns latitude/longitude.
- Results are cached in memory.
- No API key required.

```json
{
  "latitude": 31.994694,
  "longitude": 35.8303431,
  "displayName": "Khalda, Amman, Jordan",
  "source": "OpenStreetMap Nominatim"
}
```

## 🔒 Authentication & Authorization

```
Login/Register → bcrypt password hashing/comparison → req.session.userId
  → HTTP-only aqarjo.sid cookie → requireAuth → req.user → requireAdmin (when required)
```

- Session-based authentication (`express-session`) — no JWT.
- No `localStorage` authentication on the frontend.
- `password_hash` is never returned to the frontend.
- The backend checks ownership/admin access on every protected route —
  it never trusts an id sent from the client.
- All SQL queries are parameterized (`$1`, `$2`, ...).

## 🧪 Development Accounts

> These are development/demo accounts only — for local testing.

**Normal user**
- Email: `omar.masri@mail.com`
- Password: `User123!`

**Admin**
- Email: `admin@aqarjo.jo`
- Password: `Admin123!`

## 🌍 Third-Party API

**Provider:** OpenStreetMap Nominatim

**Purpose:** convert a property's area/city text into latitude/longitude
coordinates.

```
React → Express /api/location → Nominatim → Express → React map
```

- Results are cached in memory to avoid repeating identical requests.
- External failures are handled gracefully (`404`/`502`, never a crash).
- OpenStreetMap attribution is shown on the frontend.
- No API key required.
- No private user information is ever sent to Nominatim.

## ⚙️ Environment Variables

```env
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

| Variable | Purpose |
|----------|---------|
| `PORT` | Port the Express server listens on |
| `DB_USER` | PostgreSQL username |
| `DB_HOST` | PostgreSQL host |
| `DB_NAME` | PostgreSQL database name (`aqarjo_db`) |
| `DB_PASSWORD` | PostgreSQL password |
| `DB_PORT` | PostgreSQL port |
| `CLIENT_URL` | Frontend origin allowed by CORS (with credentials) |
| `SESSION_SECRET` | Secret used to sign the session cookie |
| `NODE_ENV` | `development` or `production` (affects cookie security settings) |

`.env` is git-ignored and never committed. Use your own real values
locally — never the placeholders above.
