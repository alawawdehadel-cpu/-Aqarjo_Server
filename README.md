# AqarJo Backend

Simple Node.js + Express + PostgreSQL backend for the AqarJo real estate
marketplace. It provides a REST API for properties, users, favorites and
inquiries, used by the `aqarjo_Client` React frontend.

## Technologies used

- Node.js
- Express (routing, middleware)
- PostgreSQL (database)
- pg (PostgreSQL client for Node.js)
- cors (allows the React app to call this API)
- dotenv (loads settings from a `.env` file)
- nodemon (auto-restarts the server while developing)

## Folder structure

```
aqairjo_server/
├── routes/
│   ├── userRoutes.js       # /api/users
│   ├── propertyRoutes.js   # /api/properties
│   ├── favoriteRoutes.js   # /api/favorites
│   └── inquiryRoutes.js    # /api/inquiries
├── server.js                # creates the Express app and starts the server
├── db.js                     # PostgreSQL connection (pg Pool)
├── schema.sql                 # creates tables + inserts sample data
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

Copy `.env.example` to `.env` and fill in your own PostgreSQL password:

```
PORT=5000

DB_USER=postgres
DB_HOST=localhost
DB_NAME=aqarjo_db
DB_PASSWORD=your_password
DB_PORT=5432
```

`.env` is listed in `.gitignore` and is never committed.

## 3. Create the PostgreSQL database

1. Open pgAdmin (or DBeaver).
2. Create a new database named `aqarjo_db`.
3. Open the Query Tool for `aqarjo_db`.
4. Open `schema.sql` from this folder.
5. Run it.
6. Verify the tables were created: `users`, `properties`, `favorites`, `inquiries`.

`schema.sql` also inserts sample users and about 12 sample properties
(reused from the frontend mock data) so the database has real data to
demo immediately.

## 4. Start the backend

```
npm run dev
```

(or `npm start` to run without nodemon)

## 5. Test the API

Open a browser or Postman:

```
GET http://localhost:5000/api
GET http://localhost:5000/api/properties
```

## How the frontend connects

The React app (`aqarjo_Client`) runs on `http://localhost:5173` (Vite) and
calls this API on `http://localhost:5000` using the Fetch API. `cors` is
enabled on the server so the browser allows these cross-origin requests.
See `src/api/api.ts` in the client project for the small set of helper
functions used to call each endpoint.

Because there is no real login system yet, the frontend uses a fixed
development user (`ownerId` / `userId` = `1`) for actions like adding a
property or viewing "My Properties".

## API Endpoints

### Users - `/api/users`

| Method | URL              | Purpose          | Example body |
|--------|------------------|------------------|--------------|
| GET    | /api/users       | Get all users    | -            |
| GET    | /api/users/:id   | Get one user     | -            |
| POST   | /api/users       | Create a user    | `{ "name": "Ahmad Ali", "email": "ahmad@email.com", "phone": "0790000000", "role": "user" }` |
| PUT    | /api/users/:id   | Update a user    | same as POST |
| DELETE | /api/users/:id   | Delete a user    | -            |

### Properties - `/api/properties`

| Method | URL                          | Purpose                                   | Example body |
|--------|------------------------------|--------------------------------------------|--------------|
| GET    | /api/properties              | Get all properties                        | -            |
| GET    | /api/properties/user/:userId | Get properties belonging to one user      | -            |
| GET    | /api/properties/:id          | Get one property (also increments views)  | -            |
| POST   | /api/properties              | Create a property                         | `{ "title": "...", "description": "...", "price": 85000, "listingType": "sale", "propertyType": "apartment", "city": "Amman", "area": "Khalda", "bedrooms": 3, "bathrooms": 2, "size": 150, "image": "https://...", "ownerId": 1 }` |
| PUT    | /api/properties/:id          | Update a property                         | same as POST (without ownerId) |
| PUT    | /api/properties/:id/status   | Update only the status (Admin approve/reject) | `{ "status": "approved" }` |
| DELETE | /api/properties/:id          | Delete a property                         | -            |

### Favorites - `/api/favorites`

| Method | URL                                 | Purpose                              | Example body |
|--------|-------------------------------------|----------------------------------------|--------------|
| GET    | /api/favorites/:userId              | Get favorited properties for a user  | -            |
| POST   | /api/favorites                      | Add a property to favorites          | `{ "userId": 1, "propertyId": 3 }` |
| DELETE | /api/favorites/:userId/:propertyId  | Remove a property from favorites     | -            |

### Inquiries - `/api/inquiries`

| Method | URL                 | Purpose               | Example body |
|--------|---------------------|------------------------|--------------|
| GET    | /api/inquiries      | Get all inquiries     | -            |
| GET    | /api/inquiries/:id  | Get one inquiry       | -            |
| POST   | /api/inquiries      | Send a new inquiry    | `{ "propertyId": 2, "name": "Adel", "email": "adel@email.com", "message": "I am interested in this property." }` |

## Notes

- Property JSON responses use camelCase field names (`listingType`,
  `propertyType`, `ownerId`, `dateAdded`, ...) even though the database
  columns are snake_case (`listing_type`, `property_type`, `owner_id`,
  `created_at`, ...). This is done with simple SQL aliases in the
  `SELECT` queries, e.g. `listing_type AS "listingType"`.
- `price` and `size` are cast with `::float` in the SQL query so they come
  back as JSON numbers instead of strings.
- There is no authentication yet. Login/Register are frontend placeholders
  and passwords are intentionally not implemented, since JWT/bcrypt were
  not part of the course material.
- The Favorites page currently still uses `localStorage` in the browser.
  The `/api/favorites` routes above are fully working and ready to be
  connected in a future step.
