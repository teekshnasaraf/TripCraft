# TripCraft Architecture

This document separates the implemented Phase 1 foundation from the intended
architecture for later feature phases. Planned components are not deployed
services or implemented features.

## Frontend architecture

The frontend is a React + TypeScript application built with Vite. Its current
entry point is `src/main.tsx`; `src/app/providers.tsx` centralises TanStack
Query, and `src/app/router.tsx` owns the React Router configuration. Shared
styling uses Tailwind CSS v4 with semantic CSS custom properties mapped through
the CSS-first `@theme inline` directive in `src/styles/index.css`. The token
system covers the TripCraft colour palette, typography, spacing, radii,
shadows, transitions, and container widths. `src/services/apiClient.ts`
provides the Axios instance configured from `VITE_API_BASE_URL`.

The `features/` tree is reserved for domain-oriented UI modules (auth, trips,
flights, hotels, activities, itinerary, budget, and profile). Shared components,
hooks, types, and utilities should remain separate from feature-specific code.
Reusable presentational components live in `src/components/ui/`; loading and
feedback components live in `src/components/common/`; shared site chrome is in
`src/components/layout/`. The `/` route renders the editorial landing page,
assembled from focused components in `src/features/home/`. Its trip form
validates preferences in the browser and explains that planning is not yet
connected; it does not call an API or persist trip data. Account, comparison,
optimisation, itinerary, and booking capabilities remain unimplemented. A
separate `/dev/design-system` route is available in development for visual
inspection and is omitted from production builds.

## Backend architecture

The backend is a separate Express + TypeScript application. `src/app.ts`
configures middleware and routes; `src/server.ts` connects optional persistence
and starts the HTTP listener. Configuration and the Mongoose connection helper
are in `src/config/`. Route, middleware, controller, service, model, and
integration boundaries are intended to keep HTTP handling separate from
business logic.

Implemented modules are the environment/database configuration, CORS and JSON
middleware, `GET /api/health`, a JSON not-found response, and central error
handling. Domain controllers, models, and services do not exist yet.

## Frontend/backend communication

The browser calls the backend over REST through the shared Axios client. The
base URL comes from `VITE_API_BASE_URL`; the backend allows the configured
`CLIENT_URL` origin. TanStack Query is configured as the shared client for
future server-state operations. No product API calls are implemented yet.

## Database architecture

MongoDB is the planned persistence store, accessed through Mongoose. The
connection string is `MONGODB_URI`. It is optional in local development: when it
is absent, the server starts and the health response reports
`database.configured: false` and `database.connected: false`. If a URI is set,
startup awaits a database connection and surfaces connection failures rather
than claiming success.

User, trip, offer, itinerary, and price-history schemas are future decisions;
no application models or migrations exist.

## Planned external API integrations

Flight, hotel, and activity providers will be integrated behind independent
adapters under `backend/src/integrations/providers/`. The provider layer should
translate provider-specific requests/responses to shared TripCraft contracts,
keep credentials server-side, enforce timeouts/rate policies, and retain source
and freshness metadata. No provider has been selected or configured.

## Planned AI service architecture

AI itinerary generation is planned behind a backend service boundary. The
frontend will submit validated preferences through REST; backend orchestration
will call a selected model provider, validate structured output, and return a
typed editable itinerary. Secrets, privacy/retention policies, failure handling,
and costs must be resolved before integration. No AI SDK or endpoint exists.

## Planned price comparison and optimisation

Comparison will consume normalized provider results, apply explicit
equivalence rules, and preserve provider source, currency, fees, availability,
and timestamps. Budget optimisation will build on those results with explicit
constraints and explainable alternatives. Estimates must be distinguishable
from provider-confirmed prices. Neither engine exists yet.

## Data flow

### Implemented

1. A browser loads the React/Vite application.
2. The router renders the informational homepage from `features/home/`.
3. The backend starts; if configured, it first connects to MongoDB.
4. The homepage form validates entered preferences locally and shows a
   frontend-only “coming soon” response on valid submission.
5. The backend health endpoint returns service status and whether MongoDB is
   configured and connected.
6. In development only, `/dev/design-system` renders the component preview.

### Planned

1. A user submits a trip/search request through a feature UI.
2. The frontend calls a REST route via the shared Axios client.
3. Backend validation and authorization pass a typed request to a service.
4. Provider adapters retrieve external options and normalise results.
5. Comparison/itinerary/optimisation services compose results and preserve
   source and freshness metadata.
6. Results return to the frontend for review; outbound booking links open the
   external provider. TripCraft itself does not reserve or sell travel.
