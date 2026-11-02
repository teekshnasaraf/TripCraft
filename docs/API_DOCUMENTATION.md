# TripCraft API

Base URL in local development: `http://localhost:5000/api`

Only the health endpoint is implemented. All endpoints in the roadmap below are
planned and **NOT IMPLEMENTED**.

## Implemented endpoint

### `GET /api/health`

Checks that the API process is responding. This endpoint does not require
authentication and does not perform a database query.

**Success response — `200 OK`:**

```json
{
  "status": "ok",
  "service": "TripCraft API",
  "database": {
    "configured": false,
    "connected": false
  }
}
```

`database.configured` indicates whether `MONGODB_URI` is set;
`database.connected` indicates whether Mongoose currently has an open
connection. A successful health response does not imply database connectivity.

Unknown routes return `404` with a JSON error. Unexpected request errors are
logged server-side and return a generic `500` JSON response.

## Planned endpoint roadmap — NOT IMPLEMENTED

Paths and methods are a planning outline and may change with the eventual API
contracts. No endpoint in this section exists yet.

| Area | Planned endpoints | Status |
| --- | --- | --- |
| Authentication | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `POST /auth/refresh` | NOT IMPLEMENTED |
| User profiles | `GET /users/me`, `PATCH /users/me` | NOT IMPLEMENTED |
| Trips | `GET /trips`, `POST /trips`, `GET /trips/:tripId`, `PATCH /trips/:tripId`, `DELETE /trips/:tripId` | NOT IMPLEMENTED |
| Flights | `GET /flights/search` | NOT IMPLEMENTED |
| Hotels | `GET /hotels/search` | NOT IMPLEMENTED |
| Activities | `GET /activities/search` | NOT IMPLEMENTED |
| Itinerary generation | `POST /trips/:tripId/itinerary/generate`, `GET /trips/:tripId/itinerary`, `PATCH /trips/:tripId/itinerary` | NOT IMPLEMENTED |
| Budget optimisation | `POST /trips/:tripId/budget/optimise` | NOT IMPLEMENTED |
| Saved trips | `GET /users/me/saved-trips`, `POST /trips/:tripId/save`, `DELETE /trips/:tripId/save` | NOT IMPLEMENTED |
| Price tracking | `GET /trips/:tripId/price-tracking`, `POST /trips/:tripId/price-tracking`, `DELETE /price-tracking/:trackingId` | NOT IMPLEMENTED |

Future search and recommendation responses should carry provider attribution,
currency, relevant fees, freshness/availability caveats, and outbound booking
URLs. TripCraft will not create or confirm reservations or process payments.
