# TripCraft Architecture

This document distinguishes implemented account, trip-workspace, and demo
provider flows from product capabilities that remain planned. Demo data is
never represented as a live provider offer.

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
and registration forms, an API-backed auth context, session-token helper, and
route protection; `dashboard/` owns the authenticated dashboard layout and
trip-list states; `home/` owns the landing page; and `trips/` owns trip
planning and the protected trip workspace. Shared components, hooks, types,
and utilities remain separate from feature-specific code.
Reusable presentational components live in `src/components/ui/`; loading and
feedback components live in `src/components/common/`; shared site chrome is in
`src/components/layout/`. The `/` route renders the editorial landing page,
assembled from focused components in `src/features/home/`. `/sign-in` and
`/register` provide accessible, client-validated forms connected to the
backend. The auth context restores a bearer token held in tab-scoped
`sessionStorage` by calling `GET /api/auth/me`; login and registration store
the returned access token only after a successful response. A `401` clears the
token and updates auth state. Logout clears local token state; there is no
server-side token revocation or refresh-token flow. `/dashboard` is protected
by `RequireAuth`; unauthenticated visitors are redirected to `/sign-in`.
`/dev/dashboard-preview` exists only in development to inspect the dashboard
empty states without requesting account data. `/plan-trip` is public and
validates destinations, dates, traveller counts, total INR budget,
preferences, accommodation, and trip style locally. Submission calls
`POST /api/trips`; the API requires an authenticated user and persists the trip.
The protected `/trips/:tripId` workspace exposes owner-scoped hotel, flight,
train, and destination demo searches, deterministic demo recommendations, and
saved selections. Only a TripCraft demo catalogue is registered.
The development-only `/dev/design-system` preview remains excluded from
production.

## Backend architecture

The backend is a separate Express + TypeScript application. `src/app.ts`
configures middleware and routes; `src/server.ts` connects optional persistence
and starts the HTTP listener. Configuration and the Mongoose connection helper
are in `src/config/`. Route, middleware, controller, service, model, and
integration boundaries are intended to keep HTTP handling separate from
business logic.

Implemented modules include environment/database configuration, CORS and JSON
middleware, `GET /api/health`, auth and trip routes/controllers/services,
Mongoose user/trip models, JWT authentication middleware, request validation,
the travel-provider contract, multi-adapter registry and demo adapters, and
central safe error handling. User passwords are hashed with bcryptjs;
password hashes are excluded from normal user queries and API DTOs. Access
tokens are signed with `JWT_SECRET` and expire according to `JWT_EXPIRES_IN`.
There are no refresh tokens, email verification, password recovery, or
server-side token revocation. No actual hotel, airline, rail, or location
provider integration is configured. Provider search and selection resolution
run through the registry; the registry currently contains one clearly labelled
demo adapter per category.

## Frontend/backend communication

The browser calls the backend over REST through the shared Axios client. The
base URL comes from `VITE_API_BASE_URL` (default
`http://localhost:5000/api`); the backend allows the configured `CLIENT_URL`
origin. The Axios request interceptor attaches the tab-scoped bearer token and
the response interceptor clears it on `401`. TanStack Query loads the
authenticated trip list and invalidates queries after trip mutations. The
workspace uses owner-protected search, recommendation, and selection APIs.
Provider results are sourced from server fixtures, not travel vendors.

## Database architecture

MongoDB is the persistence store, accessed through Mongoose using
`MONGODB_URI`. If the URI is absent or still contains the `<db_username>`,
`<db_password>`, or `<cluster-host>` placeholder, the server starts without
attempting a connection, health reports that the database is disconnected, and
auth/trip routes return `503`. Connection failures are logged without printing
the URI; database-backed routes remain unavailable.

The `User` model stores a unique normalized email, name, bcrypt password hash,
and timestamps. The `Trip` model stores the owning user id, destination,
dates, travellers, INR budget, preferences, accommodation, style, status,
saved travel-selection snapshots, and timestamps. Selection identifiers are
resolved by the server; request bodies cannot inject client-provided prices.
Hotel selections replace the existing hotel, flight and train selections are
mutually exclusive, and destination selections can be multiple. A compound
owner/creation-time index supports user-scoped pagination. Reads and mutations
constrain by both trip id and owner id; the API never accepts a client-supplied
owner id. Account deletion, retention, and personal-data erasure policy remain
undecided.

## Provider integration boundary

`backend/src/integrations/travel/contracts.ts` defines normalized travel
categories, offers, and the provider interface. Separate demo adapters exercise
hotel, flight, train, and destination searches. They return only explicitly
marked `demo` records; amounts are illustrative, ratings and availability are
unknown, booking URLs are absent, and the response timestamp is not vendor
freshness. Demo searches cover only fixture destinations/routes. No provider
credential configuration exists and no vendor search endpoint is called.

Real integrations remain future work: select partners with authorized API
access, verify terms and coverage, keep credentials server-side, normalize
vendor responses, enforce request cancellation/timeouts and rate limits, and
test responses against provider contracts before enabling a live source.

## Planned AI service architecture

AI itinerary generation is planned behind a backend service boundary. The
frontend will submit validated preferences through REST; backend orchestration
will call a selected model provider, validate structured output, and return a
typed editable itinerary. Secrets, privacy/retention policies, failure handling,
and costs must be resolved before integration. No AI SDK or endpoint exists.

## Planned price comparison and optimisation

The current comparison UI filters and sorts demo results. It does not merge
similar properties across sources or assert equivalence of rooms, fare rules,
or ticket conditions. Recommendation examples combine one sample hotel with
either a sample flight or a sample train, never both. The deterministic
selector ranks only by displayed sample amount; it does not score ratings,
service quality, or convenience. Amounts are explicitly incomplete and do not
claim a complete trip cost. Vendor-backed equivalence, comparison, and budget
optimisation remain future work.

## Data flow

### Implemented

1. A browser loads the React/Vite application.
2. The router serves the informational homepage, sign-in and registration
   forms, public trip planner, and an unknown-route page.
3. Sign-in and registration validate in the browser and call the auth API.
4. The auth API hashes registration passwords, verifies login credentials,
   issues an expiring access token, and returns a safe user profile.
5. `/dashboard` restores/uses the current profile, redirects unauthenticated
   visitors to `/sign-in`, and displays only trips owned by the authenticated
   user; an empty-state preview is available only in development.
6. The public trip planner validates input and sends a user-owned trip to the
   backend; the saved trip opens its protected workspace.
7. The backend starts; if configured, it first connects to MongoDB. Its health
   endpoint reports service status and database configuration/connection.
8. The protected workspace performs owner-scoped demo searches, stores
   server-resolved selection snapshots, and shows explicitly incomplete
   recommendation examples.
9. In development only, `/dev/design-system` renders the component preview.

### Planned

1. Select and obtain authorized access to real travel providers.
2. Implement and verify vendor mapping, currency/fee handling, request
   timeouts, availability semantics, and permitted booking links.
3. Add provider-backed equivalence matching and recommendation scoring only
   when data supports those claims.
4. Results may link out to a verified provider; TripCraft itself does not
   reserve or sell travel.
