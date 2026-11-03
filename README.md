# TripCraft

TripCraft is an AI-powered travel-planning platform intended to help travellers
organise trips, compare travel options across providers, and make informed
budget decisions.

## Problem and objectives

Travel planning is spread across booking sites, maps, notes, and budgets. TripCraft
will bring those planning activities together while leaving purchases with the
travel providers. The project aims to:

- Organise trip details and travel preferences in one place.
- Compare flights, accommodation, and activities across independent providers.
- Generate practical itineraries and budget-aware alternatives.
- Link travellers to external booking platforms when they are ready to book.

**TripCraft does not process bookings or payments.** The initial product will
redirect travellers to external booking platforms; it will not sell tickets,
reserve rooms, or take payment.

## Core features

Planned capabilities include trip management, travel search and comparison,
AI-assisted itinerary generation, budget optimisation, saved trips, price
tracking, and group planning. The application includes an informational landing
page, API-connected registration and sign-in, a protected dashboard, and a
trip-planning workspace with owner-scoped demo search, comparisons, and saved
selections. The backend provides JWT authentication, MongoDB persistence, and
user-scoped trip APIs. No live travel provider, availability, ratings, or
booking integration is configured; workspace examples are explicitly marked
demo data.

## Technology stack

| Area | Technology |
| --- | --- |
| Frontend | React, TypeScript, Vite, Tailwind CSS, React Router |
| Frontend data and forms | TanStack Query, Axios, React Hook Form, Zod |
| Frontend visualisation | Lucide React, Recharts |
| Backend | Node.js, Express, TypeScript |
| Persistence foundation | MongoDB with Mongoose |

## Architecture

The repository contains separate frontend and backend npm workspaces. The
frontend uses a shared Axios client and TanStack Query for authenticated API
calls. The backend is organised into route, middleware, controller, model,
configuration, and service boundaries. Planned travel integrations will be
implemented as independent provider adapters that map provider-specific
responses into common TripCraft types. See
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for implemented and planned
boundaries.

## Project structure

```text
TripCraft/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── integrations/
│   │   │   └── travel/
│   │   │       ├── contracts.ts
│   │   │       ├── providerRegistry.ts
│   │   │       └── providers/
│   │   ├── utils/
│   │   ├── types/
│   │   ├── app.ts
│   │   └── server.ts
│   └── tests/
├── docs/
├── frontend/
│   ├── public/
│   └── src/
│       ├── app/
│       ├── assets/
│       ├── components/
│       ├── features/
│       │   ├── auth/
│       │   │   ├── components/
│       │   │   ├── context/
│       │   │   ├── hooks/
│       │   │   ├── pages/
│       │   │   └── services/
│       │   ├── dashboard/
│       │   │   ├── components/
│       │   │   └── pages/
│       │   ├── home/
│       │   │   ├── components/
│       │   │   └── pages/
│       │   └── trips/
│       │       ├── components/
│       │       └── pages/
│       ├── hooks/
│       ├── lib/
│       ├── services/
│       ├── types/
│       ├── utils/
│       ├── styles/
│       └── main.tsx
├── .gitignore
└── package.json
```

Feature-specific modules and future service directories are introduced as
features are implemented; empty placeholder files are intentionally avoided.

## Frontend routes

| Route | Purpose |
| --- | --- |
| `/` | Informational landing page. |
| `/sign-in`, `/register` | Validated forms connected to backend JWT authentication. |
| `/dashboard` | Protected dashboard with the signed-in user's trip list and account-scoped overview. |
| `/trips/:tripId` | Protected workspace for owner-checked demo search, recommendations, and persisted selections. |
| `/plan-trip` | Validated public form; saving a trip requires authentication. |
| `*` | Not-found page. |
| `/dev/design-system`, `/dev/dashboard-preview` | Development-only previews, excluded from production routing. |

The auth context restores a tab-scoped JWT from `sessionStorage` by requesting
the current user. Sign-in and registration call the backend; logout clears the
local token. Refresh-token rotation, server-side logout/revocation, password
recovery, and email verification are not implemented. See
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

Travel search currently uses a small server-side demo catalogue for selected
sample routes and destinations. It does not call MakeMyTrip, Goibibo,
Booking.com, Agoda, Cleartrip, airline, IRCTC, mapping, or other providers.
Displayed sample amounts are not current offers; availability, ratings, dates,
taxes, and booking URLs are unknown. No user-supplied price is trusted when
saving a selection.

## Prerequisites

- Node.js 20.19+ or 22.12+ (the project is validated with the active Node.js
  runtime)
- npm 10+
- MongoDB is optional for local development.

## Installation

From the repository root:

```powershell
npm install
Copy-Item frontend\.env.example frontend\.env
Copy-Item backend\.env.example backend\.env
```

Set `VITE_API_BASE_URL` in `frontend/.env`. Configure `PORT`, `CLIENT_URL`,
`MONGODB_URI`, `JWT_SECRET`, and `JWT_EXPIRES_IN` in `backend/.env` as needed.
The committed backend environment template is deliberately non-connectable:
replace the Atlas username/cluster placeholders and `<db_password>` before
starting database-backed features. Do not commit `.env` files. URL-encode
reserved characters in the database password when placing it in the URI. Create
a strong JWT secret locally, for example:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

The frontend defaults to `http://localhost:5000/api`. The backend still starts
when the MongoDB URI is absent or contains placeholders, but account and trip
routes return `503` until MongoDB and a valid JWT secret are configured.

## Run the applications

In separate terminals from the repository root:

```powershell
npm run dev:frontend
npm run dev:backend
```

The Vite development server prints its local URL (normally
`http://localhost:5173`). The backend listens on port `5000` by default.

To build both workspaces:

```powershell
npm run build
```

Run isolated backend API integration tests against an ephemeral
`mongodb-memory-server` database (never your configured Atlas database):

```powershell
npm run test:backend
```

To start the compiled backend:

```powershell
npm run build --workspace @tripcraft/backend
npm run start --workspace @tripcraft/backend
```

## Environment variables

| Variable | Workspace | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Frontend | REST API base URL |
| `PORT` | Backend | HTTP port (default `5000`) |
| `NODE_ENV` | Backend | `development`, `test`, or `production` |
| `CLIENT_URL` | Backend | Allowed frontend origin for CORS |
| `MONGODB_URI` | Backend | Optional MongoDB connection string |
| `JWT_SECRET` | Backend | Strong secret used to sign access tokens (at least 32 bytes) |
| `JWT_EXPIRES_IN` | Backend | Access-token expiry duration such as `15m` (default `15m`) |

The committed `.env.example` files contain placeholders only.

## Development roadmap

The master tracking document is [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md).
It tracks eight phases, their dependencies, implementation work, and verification.

## Future integrations

The current hotel, flight, train, and destination catalogues are explicitly
mock-only. No external travel API keys are required or configured, and no
provider is represented as live. Before enabling a real source, TripCraft needs
provider-specific partner accounts and written API access/approval for the
selected products: hotel inventory (MakeMyTrip, Goibibo, Booking.com, Agoda, or
Cleartrip), flight inventory/booking partners (MakeMyTrip, Cleartrip, ixigo,
EaseMyTrip, Goibibo, or participating airlines), rail inventory (IRCTC or an
authorised rail partner), and a licensed places/attractions source. Booking
redirects also require provider-supplied, permitted URLs and any applicable
affiliate/partner approval.

No vendor environment-variable names have been defined because no provider
contract has been selected. When approved integrations are chosen, credentials
must be stored server-side under newly documented variables; never expose them
through `VITE_*` settings. Mapping and AI itinerary services are also planned,
not configured. TripCraft will direct users to third-party booking platforms
rather than handling bookings itself.

## Project status

**Implemented:** Phase 1 foundation, reusable design system, landing page,
Phase 2 authentication and owner-scoped trip APIs, and the Step 6 provider-
independent hotel/flight/train/destination demo workspace with persisted
trip-scoped selections, comparisons, and explicitly incomplete sample
recommendations. Atlas connectivity has not been verified because the
committed/local environment values are placeholders. Live provider integrations,
a standalone saved-destinations library, AI, and booking are not implemented.
