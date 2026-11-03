# TripCraft API

Base URL in local development: `http://localhost:5000/api`

All responses use JSON. Authenticated endpoints require
`Authorization: Bearer <access-token>`. Access tokens are signed using
`JWT_SECRET` and expire according to `JWT_EXPIRES_IN` (default `15m`). There is
no refresh, server-side logout/revocation, password recovery, or email
verification endpoint.

## Health

### `GET /api/health`

Does not require authentication or perform a database query.

**Success — `200 OK`:**

```json
{
  "status": "ok",
  "service": "TripCraft API",
  "database": {
    "configured": true,
    "connected": true
  }
}
```

`database.configured` reports whether a MongoDB URI is set, and
`database.connected` reflects Mongoose connection state. A successful health
response does not imply database connectivity. The server skips connection
attempts while the URI contains `<db_username>`, `<db_password>`, or
`<cluster-host>`.

## Authentication

### `POST /api/auth/register`

Creates an account and returns a safe user object and access token.

**Request:**

```json
{
  "name": "A Traveller",
  "email": "traveller@example.com",
  "password": "a-user-chosen-password"
}
```

Name must be 1–100 characters. Email must be valid and is normalized to
lowercase. Password must be 8–72 UTF-8 bytes.

**Success — `201 Created`:**

```json
{
  "success": true,
  "message": "Registration successful.",
  "data": {
    "user": {
      "id": "64f000000000000000000001",
      "name": "A Traveller",
      "email": "traveller@example.com"
    },
    "token": "<access-token>"
  }
}
```

Duplicate email returns `409 Conflict`. Password hashes are never returned.

### `POST /api/auth/login`

Accepts `email` and `password`. Returns `200 OK` with the same `data.user` and
`data.token` structure as registration. Invalid credentials return a generic
`401 Unauthorized` response.

### `GET /api/auth/me`

Requires a bearer token. Returns `200 OK` with
`{ "success": true, "data": { "user": { "id", "name", "email" } } }`.
Missing, invalid, expired, or deleted-user tokens return `401 Unauthorized`.

## Trips

Every trip endpoint requires authentication. The server assigns the owner from
the verified token; client-supplied `userId`, `owner`, or `ownerId` fields are
rejected. Get, update, and delete queries are scoped to both the trip id and
the authenticated owner.

### `POST /api/trips`

Creates a trip and returns `201 Created` with `{ "success": true, "data": {
"trip": ... } }`. `title` is optional and defaults to `Trip to <destination>`.

```json
{
  "origin": "Delhi",
  "destination": "Jaipur",
  "departureDate": "2030-07-01",
  "returnDate": "2030-07-05",
  "travellers": {
    "adults": 2,
    "children": 1
  },
  "budget": {
    "amount": 45000,
    "currency": "INR"
  },
  "interests": ["culture", "food"],
  "accommodation": "standard",
  "tripStyle": "balanced_experience"
}
```

Required fields are `origin`, `destination`, `departureDate`, `returnDate`,
`travellers`, and `budget`. Return date must not precede departure; adults must
be at least one; children cannot be negative; budget must be positive and use
INR.

Supported `interests`: `adventure`, `relaxation`, `culture`, `food`, `nature`,
`shopping`, `nightlife`, `sightseeing`.

Supported `accommodation`: `budget`, `standard`, `premium`, `luxury`.

Supported `tripStyle`: `budget_explorer`, `balanced_experience`,
`premium_experience`.

New trips start with status `draft`. Status values are `draft`, `planned`,
`completed`, and `cancelled`. These are planning records only; creating one
does not search travel providers or guarantee prices, availability, or a
booking.

### `GET /api/trips?page=1&limit=20`

Returns the current user's trips, newest first:

```json
{
  "success": true,
  "data": {
    "trips": [],
    "page": 1,
    "limit": 20,
    "total": 0,
    "summary": {
      "upcoming": 0,
      "completed": 0
    }
  }
}
```

Page and limit must be positive integers; limit cannot exceed 100.
`summary.upcoming` and `summary.completed` are owner-scoped counts across all
the user's trips, not just the current page. Upcoming counts include future or
today's trips in `draft` or `planned` status.

### `GET /api/trips/:id`

Returns the matching trip for the authenticated owner. Invalid MongoDB
ObjectIds return `400`; missing or other users' trips return `404`.

### `PATCH /api/trips/:id`

Updates supplied trip fields after validation. The body must contain at least
one supported field. Ownership fields and unknown fields are rejected.
Cross-field date and origin/destination constraints are checked against the
resulting record. Returns `200 OK` with the updated trip.

### `DELETE /api/trips/:id`

Deletes the matching trip only when it belongs to the authenticated user.
Returns `200 OK` with a success message. A trip belonging to another user is
reported as `404`, not disclosed.

## Error responses

Errors use `{ "success": false, "message": "..." }`. Common statuses:

| Status | Meaning |
| --- | --- |
| `400` | Invalid JSON, validation error, unsupported field, or malformed trip id |
| `401` | Missing, invalid, or expired authentication |
| `404` | Unknown route or trip not available to this user |
| `409` | Duplicate account email |
| `503` | Database disconnected or authentication configuration unavailable |
| `500` | Unexpected server error |

Unknown routes return `404` JSON. Error logs contain error class names, not
request credentials, MongoDB URIs, or JWT values.

## Not implemented

User profile editing/deletion, password recovery, email verification, refresh
tokens, saved destinations, travel-provider search, flight/hotel/activity
offers, itineraries, budget optimisation, maps, booking, and payment are not
implemented.
