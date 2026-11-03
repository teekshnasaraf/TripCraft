# TripCraft Architecture

This document distinguishes the implemented frontend foundation and page
structure from backend services and product capabilities that remain planned.
Frontend previews do not imply that authentication, persistence, or travel
integrations are implemented.

## Frontend architecture

The frontend is a React + TypeScript application built with Vite. Its current
entry point is `src/main.tsx`; `src/app/providers.tsx` centralises TanStack
Query, and `src/app/router.tsx` owns the React Router configuration. Shared
styling uses Tailwind CSS v4 with semantic CSS custom properties mapped through
the CSS-first `@theme inline` directive in `src/styles/index.css`. The token
system covers the TripCraft colour palette, typography, spacing, radii,
shadows, transitions, and container widths. `src/services/apiClient.ts`
provides the Axios instance configured from `VITE_API_BASE_URL`.

The `features/` tree contains domain-oriented UI modules. `auth/` owns sign-in
and registration forms, a future-facing auth context, and route protection;
`dashboard/` owns the dashboard layout and empty states; `home/` owns the
landing page; and `trips/` owns the local trip-planner form. Future flight,
hotel, activity, itinerary, budget, and profile modules can follow the same
feature boundary. Shared components, hooks, types, and utilities should remain
separate from feature-specific code.
Reusable presentational components live in `src/components/ui/`; loading and
feedback components live in `src/components/common/`; shared site chrome is in
`src/components/layout/`. The `/` route renders the editorial landing page,
assembled from focused components in `src/features/home/`. `/sign-in` and
`/register` provide accessible, client-validated forms but do not authenticate
or create accounts. `/dashboard` is protected by `RequireAuth`; with the
current unauthenticated context it redirects to `/sign-in`.
`/dev/dashboard-preview` exists only in development to inspect the dashboard
empty states. `/plan-trip` is public and validates destinations, dates,
traveller counts, total INR budget, preferences, accommodation, and trip style
locally. Neither homepage nor planner form calls an API or persists data. The
context exposes user/loading/authentication state and login/logout operations
for later integration, but those operations explicitly reject while
authentication is unavailable; no user, token, or successful login is
simulated. JWT handling, backend authentication, account storage, and recovery
remain Phase 2 work. The development-only `/dev/design-system` preview remains
excluded from production.

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
2. The router serves the informational homepage, sign-in and registration
   forms, public trip planner, and an unknown-route page.
3. Sign-in and registration validate in the browser; valid submissions clearly
   report that account operations are not connected and store no data.
4. The public trip planner validates preferences in the browser and reports
   that trip creation and live search are not connected; it makes no API call.
5. `/dashboard` checks the auth context and redirects unauthenticated visitors
   to `/sign-in`; a dashboard preview is available only in development.
6. The backend starts; if configured, it first connects to MongoDB. Its health
   endpoint reports service status and database configuration/connection.
7. In development only, `/dev/design-system` renders the component preview.

### Planned

1. A user signs in or registers through a future-connected auth form.
2. The backend validates credentials, hashes passwords, issues/refreshes JWT
   credentials, and authorizes protected routes.
3. Authenticated trip operations persist data only after user ownership and
   request validation checks.
4. A user submits a trip/search request through a feature UI.
5. The frontend calls a REST route via the shared Axios client.
6. Backend validation and authorization pass a typed request to a service.
7. Provider adapters retrieve external options and normalise results.
8. Comparison/itinerary/optimisation services compose results and preserve
   source and freshness metadata.
9. Results return to the frontend for review; outbound booking links open the
   external provider. TripCraft itself does not reserve or sell travel.
