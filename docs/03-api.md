# API Endpoints

This document lists the REST API routes exposed by the AqarJo backend.
All responses are JSON. Property fields are returned in camelCase
(`listingType`, `propertyType`, `ownerId`, ...) via SQL aliases, even
though the database columns are snake_case.

## Properties — `/api/properties`

| Method | URL | Access | Purpose |
|--------|-----|--------|---------|
| GET | `/` | public | Get all properties |
| GET | `/mine` | authenticated | Get the current user's own properties |
| GET | `/:id` | public | Get one property (increments its view count) |
| POST | `/` | authenticated | Create a property (owner = session user) |
| PUT | `/:id` | owner or admin | Update a property |
| PUT | `/:id/status` | admin | Approve/reject a property |
| DELETE | `/:id` | owner or admin | Delete a property |

## Favorites — `/api/favorites`

All routes require a logged-in session; favorites always belong to the
session user, never to an id sent by the client.

| Method | URL | Purpose |
|--------|-----|---------|
| GET | `/` | Get the current user's favorited properties |
| POST | `/` | Add a favorite (`{ "propertyId": 3 }`) |
| DELETE | `/:propertyId` | Remove a favorite |

## Users — `/api/users`

| Method | URL | Access |
|--------|-----|--------|
| GET | `/` | admin |
| GET | `/:id` | self or admin |
| POST | `/` | admin |
| PUT | `/:id` | self or admin (only an admin can change `role`) |
| DELETE | `/:id` | admin |

## Inquiries — `/api/inquiries`

| Method | URL | Access |
|--------|-----|--------|
| GET | `/` | admin |
| GET | `/:id` | admin |
| POST | `/` | public — used by the Property Details inquiry form |

## Location — `/api/location`

| Method | URL | Access |
|--------|-----|--------|
| GET | `/?area=Khalda&city=Amman` | public — geocodes text into map coordinates via OpenStreetMap Nominatim |

## Conventions

- All SQL queries use parameterized values (`$1`, `$2`, ...).
- Standard status codes: `200` success, `201` created, `400` bad request,
  `401` not authenticated, `403` forbidden, `404` not found, `500` server
  error.
- CRUD write routes are defined with plain `router.get/post/put/delete`
  handlers in `routes/` — no separate controller layer.
