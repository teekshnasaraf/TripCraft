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
tracking, and group planning. These features are not implemented yet. The
current application is a working frontend and backend foundation with a single
API health endpoint.

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
browser application calls the backend over REST using a shared Axios client.
The backend is organised into route, middleware, configuration, and service
boundaries. Planned travel integrations will be implemented as independent
provider adapters that map provider-specific responses into common TripCraft
types. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for implemented and
planned boundaries.

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
│   │   ├── integrations/providers/
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

## Prerequisites

- Node.js 20.19+ or 22.12+ (the project is validated with the active Node.js
  runtime)
- npm 10+
- MongoDB is optional for the Phase 1 development server.

## Installation

From the repository root:

```powershell
npm install
Copy-Item frontend\.env.example frontend\.env
Copy-Item backend\.env.example backend\.env
```

Set `VITE_API_BASE_URL` in `frontend/.env` and `PORT`, `CLIENT_URL`, and
optionally `MONGODB_URI` in `backend/.env` as needed. Do not commit `.env` files.
The frontend default points to `http://localhost:5000/api`. Without a MongoDB
URI, the backend starts in development mode and reports that database
connectivity has not been established.

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
| `JWT_SECRET` | Backend | Reserved for future authentication; not currently used |

The committed `.env.example` files contain placeholders only.

## Development roadmap

The master tracking document is [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md).
It tracks eight phases, their dependencies, implementation work, and verification.

## Future integrations

Provider integrations, mapping, and AI itinerary services are planned, not
configured. Provider credentials and service choices will be evaluated in the
phases that implement them. TripCraft will direct users to third-party booking
platforms rather than handling bookings itself.

## Project status

**Phase 1 foundation:** frontend and backend starter applications, environment
examples, and project documentation are implemented and locally verified.
The foundation is published on GitHub `main`. Only the API health endpoint is
available; authentication, database models, provider integrations, AI, and
trip-planning features are not implemented.
