# TripCraft Implementation Plan

This is the master project tracking document. Update the relevant phase,
status, development log, and next-step sections after every significant
implementation; preserve the history rather than replacing the plan.

## Current project status

- **Current phase:** Phase 3 – Travel Discovery and Comparison.
- **Overall status:** Phases 1–2 and the Step 6 provider-independent
  travel-workspace foundation are implemented. The current provider registry
  is demo-only; Ignav connectivity was verified for two sample Indian routes,
  Step 7A implements a disabled-by-default usage-management layer, and Step 7B
  adds a guarded one-way adapter that has not been used for live requests.
  Atlas remains unverified.
- **Booking model:** TripCraft will link users to external booking platforms;
  TripCraft will not process bookings or payments.
- **Implemented product surface:** Informational landing page; JWT-backed
  registration/sign-in; authenticated dashboard and owner-scoped trip APIs;
  trip creation; hotel/flight/train/destination demo search; saved trip
  selections; incomplete price-only demo combinations; and development
  previews.
- **Not implemented:** Atlas connectivity verification with real credentials,
  profile editing/deletion, password recovery, token refresh/revocation,
  live Ignav activation and flight UI/recommendation integration (the backend
  adapter is implemented but disabled by default and not live-verified),
  vendor-backed prices/availability/ratings,
  cross-provider offer equivalence, complete trip estimates, AI, maps,
  booking, or payment.

## Phase tracking

### PHASE 1 – Project Foundation and Frontend Setup

- **Objective:** Establish a secure, buildable frontend/backend workspace,
  shared conventions, and initial project documentation.
- **Features to implement:** Minimal TripCraft frontend shell; REST API health
  endpoint; environment-based API and server configuration.
- **Detailed implementation tasks:**
  - [x] Establish separate npm workspaces for React/Vite and Express.
  - [x] Configure strict TypeScript for frontend and backend.
  - [x] Configure Tailwind CSS, React Router, TanStack Query, and Axios client.
  - [x] Add an identifiable minimal frontend starter page.
  - [x] Separate Express `app.ts` from `server.ts`; configure CORS and JSON.
  - [x] Add optional Mongoose connection configuration and no-database startup.
  - [x] Add `GET /api/health`, not-found handling, and central error handling.
  - [x] Add environment examples and ignore real environment files/build output.
  - [x] Document the architecture, API surface, and eight-phase roadmap.
  - [x] Install dependencies; frontend and backend builds pass.
  - [x] Verify frontend dev server, backend health, no-database startup, and
    unknown-route handling.
  - [x] Verify environment/build ignore rules and repository-local author and
    committer identity.
  - [x] Create the initial commit and publish it to the remote `main` branch.
  - [x] Define semantic colour, typography, spacing, radius, shadow, motion,
    and container tokens using CSS variables and Tailwind CSS v4 `@theme`.
  - [x] Implement typed shared buttons, inputs, cards, badges, containers, and
    section headings.
  - [x] Implement loading, skeleton, empty, and error feedback components.
  - [x] Add responsive Navbar and Footer building blocks with accessible
    navigation and placeholder legal links.
  - [x] Add a development-only design-system preview route and component
    showcase; confirm the route and preview chunk are excluded from production.
  - [x] Inspect desktop and mobile layouts, keyboard-operable mobile navigation,
    accessible labels/states, and browser console.
  - [x] Pass frontend TypeScript and production build checks; add no dependencies.
  - [x] Build the `/` landing page from focused home-feature page and section
    components without replacing the shared component architecture.
  - [x] Add a responsive navbar with homepage anchors, mobile navigation, a
    working trip-planning CTA, and a clear sign-in-coming-soon notice.
  - [x] Add a controlled trip-search form with required-field, origin/destination,
    date-order, traveller-count, and positive-budget validation.
  - [x] Keep search submission frontend-only, preserve entered values, and
    disclose that trip-planning functionality is not connected.
  - [x] Add six editorial destination cards with descriptive alt text, lazy
    loading, and image failure fallbacks; show no fabricated prices or ratings.
  - [x] Add the planned four-step explainer, capability highlights, travel
    styles, final CTA, and homepage footer.
  - [x] Verify anchor navigation, CTAs, form errors and valid submission, mobile
    menu behavior, imagery, and responsive layouts at 390, 768, and 1440 px.
  - [x] Verify the development design-system route still works and remains
    excluded from the production build.
  - [x] Pass frontend TypeScript/production build and unaffected backend build;
    no dependencies were added.
- **Relevant frontend modules:** `frontend/src/app/`, `components/ui/`,
  `components/common/`, `components/layout/`, `components/dev/`, `styles/`,
  `services/`, and Vite/TypeScript configuration.
- **Relevant backend modules:** `backend/src/config/`, `middleware/`, `routes/`,
  `app.ts`, and `server.ts`.
- **Required external integrations:** None. MongoDB is optional in development.
- **Expected outcome:** Independently runnable frontend and backend; a working
  health route; maintainable baseline documentation and a responsive, reusable
  frontend design system and informational homepage. Landing-page search and
  product capabilities remain frontend-only/planned until their phases are
  implemented.
- **Dependencies on previous phases:** None.
- **Testing requirements:** npm dependency installation; strict frontend build;
  backend TypeScript build; frontend server startup; backend startup without
  MongoDB; health and unknown-route HTTP checks; secret-ignore checks; design
  preview route and component import checks; homepage route, anchor/CTA and
  form validation/submission checks; responsive browser inspection at 390, 768,
  and 1440 px; image-load/fallback and console-error checks.
- **Current status:** Complete.

### PHASE 2 – Authentication and Trip Management

- **Objective:** Establish user identity, profile management, and persisted trip
  lifecycle.
- **Features to implement:** Registration/sign-in, authenticated profile,
  create/read/update/delete trips, ownership checks, trip preferences.
- **Detailed implementation tasks:**
  - [x] Define user/trip schemas, unique and owner-scoped indexes, strict
    validation, and safe response DTOs; no seed data is required.
  - [x] Implement bcrypt password hashing, expiring JWTs, bearer authorization,
    session-token handling, and safe secret/error logging. Refresh and
    server-side revocation are intentionally not implemented.
  - [x] Add registration, login, current-user, and user-owned trip CRUD REST
    routes, controllers, and services.
  - [x] Connect sign-in and registration forms with client validation,
    accessible feedback, loading states, and navigation only after API success.
  - [x] Add a typed auth context, token restoration, logout, and protected-route
    redirect; no user or successful session is fabricated.
  - [x] Connect the responsive dashboard to the authenticated trip list and
    accurate owner-scoped summary counts; preserve honest empty/error states.
  - [x] Connect the public trip-planner form to authenticated trip creation
    with local validation and no provider search or fabricated offers.
  - [x] Add `/sign-in`, `/register`, `/dashboard`, `/plan-trip`, and not-found
    routing while preserving `/`; add a development-only dashboard preview.
  - [x] Connect profile lookup, trip list, creation, and persistence to the
    Phase 2 backend; backend trip edit/delete routes enforce ownership.
  - [x] Add isolated auth/trip API integration coverage using an ephemeral
    MongoDB instance, including owner isolation, validation, and DB-unavailable
    behavior.
  - [ ] Connect trip editing/deletion controls in the UI and decide account
    deletion, retention, and personal-data erasure behavior.
  - [ ] Replace local MongoDB/JWT placeholders with deployment-managed values
    and verify a real Atlas connection; no Atlas credentials are committed.
- **Relevant frontend modules:** `features/auth/`, `features/profile/`,
  `features/trips/`, shared form components, API services.
- **Relevant backend modules:** `models/`, `services/auth/`, `services/trips/`,
  `controllers/`, `routes/`, `middleware/`.
- **Required external integrations:** MongoDB deployment and JWT secret
  management; email provider only if account verification or recovery is
  selected.
- **Expected outcome:** Users can authenticate and manage persisted,
  owner-scoped trips; live travel search remains a later phase.
- **Dependencies on previous phases:** Phase 1.
- **Testing requirements:** Unit/API integration, authorization/ownership,
  validation, password handling, frontend form/route tests, and configured
  database connectivity verification.
- **Current status:** Complete for the implemented account and trip CRUD
  flows. Placeholder-only configuration intentionally prevents an Atlas
  connection; profile mutation, trip edit/delete UI, retention policy, and
  real deployment credentials remain outstanding.

### PHASE 3 – Travel Discovery and Provider Integrations

- **Objective:** Establish normalized, replaceable discovery for hotels,
  flights, trains, and destinations, then connect authorized real providers.
- **Features to implement:** Search request models, provider adapters,
  normalization, provider availability/error handling, result freshness,
  selection persistence, and planning workspace.
- **Detailed implementation tasks:**
  - [x] Define a normalized provider and travel-option contract.
  - [x] Add separate hotel, flight, train, and destination demo adapters with
    explicit demo provenance, unknown availability, and no booking URLs.
  - [x] Add authenticated, owner-scoped search and selection endpoints;
    selections are resolved server-side and persisted on owned trips.
  - [x] Add the protected responsive trip workspace, category navigation,
    category filters, result sorting, saved selections, and budget caveats.
  - [x] Add deterministic sample combinations that choose either a flight or a
    train and disclose incomplete costs and price-only ranking; exclude
    unpriced options rather than treating unknown costs as zero.
  - [x] Test filtering, demo metadata, selection persistence/replacement,
    duplicate handling, recommendation shape and price calculations, and user
    ownership isolation, including recommendation exclusion for unknown prices.
  - [x] Verify the protected workspace, hotel/flight/train/destination search,
    selection flow, and responsive layouts at 390, 768, and 1440 px in browser.
  - [ ] Select authorized real providers and implement/test their actual APIs,
    timeouts, error mapping, terms compliance, and server-side credentials.
  - [ ] Add robust room/fare equivalence matching, vendor-backed freshness,
    verified rating/availability handling, and complete tax/fee costs.
- **Relevant frontend modules:** `features/trips/`, `features/flights/`,
  `features/hotels/`, `features/activities/`, and `services/`.
- **Relevant backend modules:** `integrations/travel/`, trip routes/services,
  validators, and the trip model.
- **Required external integrations:** None for the demo foundation. Approved
  vendor APIs and credentials are still required for live results.
- **Expected outcome:** Provider-independent discovery contracts and an
  inspectable demo workspace; live sourced results remain pending.
- **Dependencies on previous phases:** Phase 1; Phase 2 for user-owned saved
  searches and trips.
- **Testing requirements:** Adapter contract tests, mocked provider tests,
  timeout/error/rate-limit tests, and end-to-end search checks.
- **Current status:** Step 6's provider-independent demo foundation is complete:
  the protected workspace, demo adapters, owner-scoped search/selections, and
  tested recommendations are implemented. Recommendations rank complete
  known-price demo hotel/transport combinations; Balanced Experience targets
  70% of the trip budget and unknown prices are excluded, never treated as
  zero. Phase 3 remains in progress for authorised live providers and
  vendor-backed data. The trip workspace still uses only demo providers;
  Step 7B adds a separate authenticated Ignav one-way search endpoint and
  adapter, but live search is disabled by default and has not been live-tested.
  Ignav connectivity was previously assessed with two isolated live searches;
  Step 7A provides the usage guard.

### STEP 7A – Ignav Flight Usage and Cost Protection

- **Status:** Implemented as a pre-integration control layer. No Ignav client,
  live flight provider, search endpoint, or flight UI is wired to it.
- **Persistent accounting:** MongoDB singleton state tracks the estimated
  confirmed usage, reserved billable requests, cache counters, blocked
  requests, and last successful provider response. A separate operation
  ledger records provider, operation, status, billability, response status,
  timestamp, opaque reservation ID, and allowlisted route/search metadata.
  The two previously assessed successful calls seed the ledger's initial
  estimate only when the singleton state is first created. That estimate is
  not fetched from Ignav and environment changes do not reset existing state.
- **Reservation rules:** Each billable operation atomically reserves one slot
  before calling its injected provider function, with a MongoDB atomic
  hard-limit check. Only HTTP 200 confirms usage. Definitive non-200 responses
  are recorded as failed and release the reservation. Network errors,
  timeouts, process interruptions, and other ambiguous outcomes retain the
  reservation and block identical searches for the cache window. Ledger errors
  fail closed; no automatic retries are performed.
- **Search cache and duplicate control:** Search parameters are recursively
  canonicalized and hashed, so different material parameters cannot share an
  entry. MongoDB stores successful responses for the configured TTL (30
  minutes by default); expired values are deleted/ignored. A unique pending
  cache record coalesces identical requests across backend instances.
  Failures are not cached as successful values. An ambiguous request blocks
  its identical key until its safety entry expires; its usage reservation is
  not released by cache expiry.
- **Rate and spend controls:** Per-user request buckets are stored in MongoDB
  and expire automatically (default 10 requests/minute). The internal ceiling
  defaults to 800 confirmed-plus-reserved requests. The configured initial
  estimate is 2, yielding 798 estimated internal requests remaining. Live
  operation execution is disabled by default.
- **Configuration:** `IGNAV_FREE_ALLOWANCE` (1000),
  `IGNAV_INTERNAL_LIMIT` (800), `IGNAV_INITIAL_USED` (2),
  `IGNAV_CACHE_TTL_MINUTES` (30), `IGNAV_LIVE_SEARCH_ENABLED` (false),
  `IGNAV_USER_RATE_LIMIT_PER_MINUTE` (10),
  `IGNAV_REQUEST_TIMEOUT_MS` (30000), and
  `IGNAV_USAGE_ADMIN_EMAILS` (empty by default). Usage admins are configured
  by comma-separated account email. `IGNAV_API_KEY` belongs only in the
  backend secret environment; the manager does not read or use it.
- **Usage endpoint:** `GET /api/flights/usage` requires a valid bearer token,
  MongoDB availability, and an email in `IGNAV_USAGE_ADMIN_EMAILS`. It returns
  aggregate counts, the configured internal budget, cache/block counters,
  enablement status, and last successful request time. It marks the balance
  as not provider-verified and excludes credentials and raw request data.
- **Verification:** Mock-only backend tests cover disabled mode, reservation
  before provider invocation, cache hits/misses/expiry, 4xx/5xx accounting,
  timeout ambiguity, hard-limit concurrency, duplicate coalescing, per-user
  throttling, restricted usage reporting, persistence across a fresh backend
  process, cache-key isolation, provider-error redaction, and unavailable-ledger
  fail-closed behavior. Backend TypeScript production build and all 26 backend
  tests pass; no frontend files or shared types changed.
- **Runtime verification:** Started the production backend against a disposable
  MongoDB instance, verified health/readiness and the usage endpoint over HTTP,
  then restarted the backend against the same disposable database. Anonymous
  access returned 401, an authenticated non-admin returned 403, and an
  allowlisted admin received every expected usage field. Two identical
  injected mock searches made one executor call and reported one cache hit,
  one miss, one confirmed operation, and zero reservations; the state and
  counters remained after restart. Runtime settings resolved to live search
  disabled, allowance 1000, internal cap 800, initial estimate 2, and a
  30-minute cache TTL. The disposable database was discarded; no configured
  application database or user trip data was changed.
- **Verification boundaries:** The 26-test suite is isolated integration
  coverage using mock provider responses and ephemeral MongoDB. Runtime
  verification exercised the local HTTP server and backend restart using the
  same ephemeral database. The separate prior provider-connectivity assessment
  made two live Ignav fare requests; this Step 7A verification made zero live
  provider requests and consumed zero provider credits. Local usage values
  remain estimates, not Ignav's authoritative account balance.
- **Limitations:** No reconciliation API for comparing local estimates with
  Ignav's authoritative balance exists. Reservations left by ambiguous outcomes
  are intentionally conservative and require operational review. The manager
  is not connected to any production flight search path; enabling its setting
  alone does not integrate Ignav.

### PHASE 4 – Price Comparison Engine

- **Objective:** Compare equivalent offers across providers transparently.
- **Features to implement:** Currency-aware normalization, ranking, filters,
  price breakdowns, source and timestamp display.
- **Detailed implementation tasks:**
  - Define equivalence rules for routes, room occupancy, dates, and activity
    inclusions.
  - Normalize currencies and fees while retaining provider-native amounts.
  - Implement comparison, sort, filtering, and duplicate handling.
  - Show availability caveats, provider source, timestamps, and outbound links.
- **Relevant frontend modules:** `features/flights/`, `features/hotels/`,
  `features/activities/`, `components/`.
- **Relevant backend modules:** Provider services, shared types, comparison
  services, and currency configuration.
- **Required external integrations:** Phase 3 providers; exchange-rate source
  where cross-currency comparison is enabled.
- **Expected outcome:** Explainable comparisons without implying guaranteed
  prices or in-app booking.
- **Dependencies on previous phases:** Phase 3.
- **Testing requirements:** Deterministic ranking and currency tests, edge cases
  for incomplete data, and comparison UI tests.
- **Current status:** Partially implemented for clearly labeled demo fixtures;
  provider equivalence and live multi-source comparison remain pending.

### PHASE 5 – AI-Powered Itinerary Generation

- **Objective:** Generate editable, preference-aware trip itineraries.
- **Features to implement:** Itinerary inputs, day/activity schedule,
  alternatives, regeneration and editable saved itinerary.
- **Detailed implementation tasks:**
  - Select an AI service and define privacy, retention, and cost controls.
  - Create a typed itinerary contract and input validation.
  - Implement prompt/service orchestration and structured-output validation.
  - Ground suggestions in available travel/activity data where possible.
  - Provide transparent limitations, editable results, and safe failure behavior.
- **Relevant frontend modules:** `features/itinerary/`, `features/trips/`,
  `features/activities/`.
- **Relevant backend modules:** `services/itinerary/`, provider integrations,
  trip services, and shared types.
- **Required external integrations:** AI model/service and optionally location
  or activity data APIs.
- **Expected outcome:** A useful draft itinerary that users can inspect and
  revise; generated content is not a booking confirmation.
- **Dependencies on previous phases:** Phase 2; Phase 3 for sourced options is
  recommended.
- **Testing requirements:** Schema and prompt-contract tests, mocked AI
  responses, invalid-output and timeout cases, and user editing flows.
- **Current status:** Pending.

### PHASE 6 – Smart Budget Optimisation Engine

- **Objective:** Help travellers understand and adjust trip costs against a
  target budget.
- **Features to implement:** Budget categories, estimates, alternatives,
  trade-offs, budget summaries.
- **Detailed implementation tasks:**
  - Define cost model, currency handling, taxes/fees, and estimate provenance.
  - Implement deterministic constraints and ranking before considering
  heuristic/AI-assisted recommendations.
  - Generate explainable substitutions and display their quality trade-offs.
  - Keep estimates distinct from provider-confirmed prices.
- **Relevant frontend modules:** `features/budget/`, `features/trips/`,
  `features/flights/`, `features/hotels/`, `features/activities/`.
- **Relevant backend modules:** `services/optimisation/`, comparison services,
  provider data contracts.
- **Required external integrations:** Phase 3 providers and Phase 4 comparison;
  currency data as needed.
- **Expected outcome:** Traceable options that meet or approach a user-defined
  budget without misrepresenting estimates as guaranteed totals.
- **Dependencies on previous phases:** Phases 2–4; Phase 5 is optional for
  itinerary-aware optimisation.
- **Testing requirements:** Constraint/property tests, currency and missing-price
  cases, deterministic ranking, and budget UI tests.
- **Current status:** Pending.

### PHASE 7 – Maps, Group Planning and Advanced Features

- **Objective:** Extend planning to locations, collaborators, and useful
  planning enhancements.
- **Features to implement:** Map views, shared trips, collaboration,
  notifications, saved searches and price tracking as prioritised.
- **Detailed implementation tasks:**
  - Select a map/geocoding provider and document data/licensing requirements.
  - Define collaboration roles, invitation flow, and conflict handling.
  - Add notifications and tracked-price refresh policy only after provider
    terms and rate limits are confirmed.
  - Prioritise accessibility, privacy, and user controls for each advanced
    feature.
- **Relevant frontend modules:** `features/trips/`, `features/profile/`,
  maps/group/notification feature modules.
- **Relevant backend modules:** Trip services, provider adapters, tracking jobs,
  notification integrations, and authorization middleware.
- **Required external integrations:** Mapping/geocoding and, if selected,
  notification and background-job infrastructure.
- **Expected outcome:** Collaborative planning with map context and selected
  advanced capabilities.
- **Dependencies on previous phases:** Phase 2; Phases 3–6 as applicable to
  individual capabilities.
- **Testing requirements:** Collaboration authorization/concurrency, map
  integration, background-job behavior, and accessibility checks.
- **Current status:** Pending.

### PHASE 8 – Testing, Deployment and Finalisation

- **Objective:** Deliver a reliable, monitored, secure, and supportable
  production application.
- **Features to implement:** Comprehensive automated test coverage, deployment
  pipeline, production configuration, monitoring, and operational documentation.
- **Detailed implementation tasks:**
  - Expand unit, integration, contract, accessibility, and end-to-end suites.
  - Establish CI checks, dependency/security scanning, and reproducible builds.
  - Choose hosting, managed MongoDB, secret storage, and deployment strategy.
  - Configure HTTPS, CORS, logging, metrics, backups, and incident procedures.
  - Verify provider terms, privacy notices, data retention, and outbound links.
- **Relevant frontend modules:** All frontend workspaces and deployment setup.
- **Relevant backend modules:** All backend services plus operational
  configuration and health/readiness endpoints.
- **Required external integrations:** Hosting, managed database, observability,
  CI/CD, and production provider services.
- **Expected outcome:** Tested and deployable product with documented operating
  and recovery procedures.
- **Dependencies on previous phases:** Phases 1–7, with final scope based on
  features actually released.
- **Testing requirements:** Full regression, security review, performance,
  deployment smoke tests, backup/restore, and production-readiness checks.
- **Current status:** Pending.

## Status summary

- **Completed tasks:** Phase 1 foundation, design system, and landing page;
  Phase 2 frontend/backend authentication and trip management; initial Step 6
  provider-neutral demo search, selection, and planning workspace foundation;
  Step 7A Ignav usage controls (disabled by default).
- **In progress:** Phase 3 authorized provider integration and live data
  validation.
- **Pending tasks:** Remaining Phase 2 account/retention work and live portions
  of Phases 3–8.

## Technical decisions

| Decision | Rationale / status |
| --- | --- |
| Separate frontend and backend npm workspaces | Keeps browser and server responsibilities distinct while providing one root install/build. |
| TypeScript strict mode | Catches structural errors before runtime in both applications. |
| CSS variables with Tailwind CSS v4 `@theme inline` | Provides semantic design tokens while retaining the existing Vite plugin and avoiding a legacy Tailwind config. |
| Shared UI, common, and layout component layers | Keeps generic controls, feedback states, and navigation reusable across future features. |
| Development-only lazy design-system route | Allows component inspection without exposing the preview page or chunk in production builds. |
| Home feature sections under `features/home/` | Keeps landing-page sections focused and makes reuse/iteration straightforward. |
| Client-only search preview | Validates preferences and explains current limitations without calling nonexistent APIs or implying search results. |
| Fixed Unsplash image URLs with graceful fallback | Supplies editorial imagery without adding a package or random image endpoint; remote images remain optional. |
| Auth context with no simulated user | Establishes the frontend contract and protected-route behavior without fake credentials or a fabricated successful session. |
| Development-only dashboard preview | Allows empty-state layout inspection while production `/dashboard` remains protected and redirects unauthenticated users. |
| Local-only trip-planner validation | Exercises the future input shape without API calls, database records, or fabricated prices/availability. |
| REST communication | Establishes a simple explicit boundary between frontend and backend. |
| Mongoose connection is optional during local development | The health service and initial API can run before database credentials exist. |
| Provider adapters normalise external offers | Planned integration isolates provider APIs and supports comparison against shared contracts. |
| Demo catalogue is explicitly non-live | Exercises search, filters, persistence, and UI without suggesting that provider APIs, prices, or availability exist. |
| Save only server-resolved catalogue options | Prevents a client from supplying or modifying persisted sample prices and provider attribution. |
| Flight and train are alternative selections | Prevents accidental double-counting one trip leg in the selection summary. |
| External booking links, not in-app booking | Keeps the initial product out of payment and reservation processing. |
| No authentication, AI, or provider SDKs in Phase 1 | Avoids unused dependencies and premature integration choices. |

## Dependencies

- Node.js and npm for workspaces, development, and builds.
- MongoDB only when persistence is enabled; no database is required for the
  initial development server.
- External provider/AI/map services are not configured and require separate
  selection, access, and credentials in later phases.

## Known limitations

- The frontend root remains informational; destination cards are editorial
  samples, not live offers.
- `/plan-trip` creates a persisted planning record when the user is signed in
  and MongoDB/JWT configuration is valid.
- `/trips/:tripId` searches only a finite TripCraft demo catalogue for selected
  Jaipur and Goa routes/places. Demo amounts are illustrative, not date-aware
  or bookable; availability, ratings, and vendor freshness are unknown.
- Current recommendations rank demo sample combinations by displayed amount
  and budget fit and show an incomplete known-amount total. The balanced sample
  targets 70% of budget; unknown-price options are excluded. They do not model
  quality, taxes, return fares, activities, or local transport.
- Trip records can be read, edited, and deleted through owner-protected APIs;
  the dashboard UI currently exposes listing and creation, not editing or
  deletion.
- Atlas/JWT values are local placeholders. No live Atlas connection or
  persisted production data has been verified.
- Authentication uses short-lived bearer tokens in tab-scoped `sessionStorage`.
  Refresh, server-side revocation/logout, email verification, and password
  recovery are not implemented.
- Saved destinations, profile editing/deletion, and account data retention/
  erasure policy are not implemented or finalized.
- Editorial image URLs require network access; unavailable images show a local
  placeholder rather than breaking the layout.
- Navbar/footer product and legal destinations are placeholders until their
  corresponding routes and policies exist.
- The design preview is available only in the Vite development build.
- Backend auth/trip integration tests use an isolated ephemeral MongoDB; they
  do not test connectivity to the configured Atlas deployment.
- No dedicated automated frontend component-test runner is configured;
  frontend behavior is checked with browser route, validation, and responsive
  tests plus TypeScript/production builds.
- MongoDB is not required for the health route; database availability is
  reported as configured/connected, while database-backed routes return `503`
  when the connection is unavailable.
- No live provider, booking, payment, AI, map, or price-tracking capability
  exists.

## Development log

| Date | Update |
| --- | --- |
| 2026-11-03 | Started Phase 1 repository foundation, frontend/backend scaffolding, and documentation. |
| 2026-11-03 | Installed workspace dependencies (npm audit: 0 vulnerabilities); frontend and backend builds passed. Frontend returned HTTP 200; backend health returned HTTP 200 without MongoDB and an unknown route returned HTTP 404. |
| 2026-11-03 | Published the Phase 1 foundation to GitHub `main` as commit `eb3d2da35366eedd655c34277b08e50a9ced939d`. |
| 2026-11-03 | Completed Phase 1 Step 2: semantic Tailwind v4 design tokens, reusable UI/common/layout components, and dev-only design preview; builds and browser checks passed. |
| 2026-11-03 | Completed Phase 1 Step 3: responsive landing page, controlled local-only trip form, six editorial destinations, informational sections and CTAs; verified form/nav interactions, remote imagery, 390/768/1440 px layouts, clean browser console, and production exclusion of the design preview. Frontend and backend builds passed; no dependencies added. |
| 2026-11-03 | Completed the reusable frontend design system, semantic CSS/Tailwind v4 tokens, common and layout components, and a development-only preview. TypeScript and production builds passed; browser checks at 390, 768, and 1440 px found no horizontal overflow or console errors, and keyboard navigation worked. Production output excludes the preview route and chunk. No dependencies were added. |
| 2026-11-03 | Completed Step 4 frontend structure: sign-in/register pages, explicit unavailable-auth context, protected dashboard route with dev preview, responsive empty-state dashboard, public locally validated trip planner, and not-found route. Frontend TypeScript/production build and backend build passed. Browser checks covered route navigation, validation, password visibility/confirmation, protected redirect, no API requests or console errors, and 390/768/1440 px layouts with no horizontal overflow. Production bundle excludes development preview routes. No dependencies added; backend auth, account/trip persistence, and live search remain pending. |
| 2026-11-03 | Implemented Phase 2 authentication and trip persistence: bcrypt/JWT registration/login/current-user APIs, Mongoose user/trip models, owner-scoped trip CRUD, strict validation, safe placeholder-aware MongoDB startup, session-scoped frontend auth, connected dashboard and trip creation, and isolated MongoMemoryServer/Supertest tests (6 passing). Frontend and backend builds passed. Browser E2E against a separate in-memory MongoDB verified registration, sign-in, trip creation/listing, cross-account isolation, logout/token clearing, and protected redirects; route/forms/password visibility and 390/768/1440 px layouts were also checked without overflow. Development preview route strings are absent from production bundles. The placeholder-only server correctly returned 503 for database-backed operations; no live Atlas connection was attempted. Trip edit/delete UI, recovery/refresh, and data-retention policy remain pending. |
| 2026-11-03 | Implemented the Step 6 provider-independent discovery foundation: normalized hotel/flight/train/destination contracts, demo adapters, owner-scoped APIs, persisted selections, and a responsive workspace. Recovery audit confirmed the committed `travel.service.ts` was complete and buildable. Follow-up fixes exclude unpriced offers from maximum-budget results and accurately label per-journey prices. All 10 backend integration tests and root frontend/backend production builds passed. Browser checks exercised authentication, all four discovery searches, selection save/remove and persistence after reload, and 390/768/1440 px layouts without horizontal overflow or browser console errors. No vendor APIs or Atlas credentials are configured. |
| 2026-11-05 | Re-audited the clean `main` checkout after the prior AI review was undone: the Step 6 foundation was already present in commit `8a5e153` and the latest commit only changed seven files. Hardened recommendation pricing so unknown/non-finite prices are excluded instead of counted as zero, defined deterministic budget-targeted recommendation explanations, added distinct demo amounts/durations to exercise flight/train sorting, and corrected trip-planner copy that incorrectly said recommendations were not connected. Backend TypeScript build and all 12 backend integration tests pass. Browser checks against an isolated ephemeral MongoDB covered registration, trip creation, recommendations, all four discovery tabs, category filters, price/duration sorting, selection persistence after reload and removal, and 390/768/1440 px layouts without horizontal overflow or console errors. Live provider APIs and Atlas persistence remain unverified and are not claimed. |
| 2026-11-05 | Completed an isolated OBO Travel MCP connectivity/capability assessment using the official MCP TypeScript SDK installed only in a temporary directory. The Streamable HTTP/JSON-RPC 2.0 connection and authenticated `tools/list` succeeded with the server-only `X-OBO-Key` header and returned 13 tools. Definitions identify `search_hotels` for live availability/prices, `get_hotel_offers` for room offers, `get_offer_policies` for confirmed price/cancellation details, and `get_booking_link` for canonical booking links. One read-only search for Delhi, India (2026-12-10 to 11; one adult, one room, one-result limit) returned successfully with zero hotels; Indian inventory was not verified. No rate-limit or protocol error was reported. OBO API Terms of Use (v1.2, https://onebookingonline.com/api-terms), sections 8 and 16, prohibit a competing hotel price-comparison feed based on OBO data unless OBO grants written permission within the relevant scope. No OBO adapter or discovery behavior was changed; obtain written permission before any multi-provider comparison, and follow attribution, unchanged booking-link, result-freshness, and retention requirements if later approved. |
| 2026-11-05 | Completed an Ignav flight API connectivity and Indian-route coverage assessment using only its documented REST endpoint and `X-Api-Key` header. Two documented one-way searches (HYD–BOM and MAA–DEL, 2026-12-10, market IN, one adult, economy) both returned HTTP 200, valid itineraries, INR prices marked verified, and UTC `observed_at` timestamps; the first five inspected results for each route included IndiGo (6E) nonstop flights with segment airport/time and duration data. No booking-link request was made: the itinerary handoff IDs were not retained, and another fare search would exceed the two-search assessment limit. Official docs state the API supports booking-link lookup. Ignav pricing docs state 1,000 free requests are one-time, then $2 per 1,000 successful requests; successful searches consume credits, failed 4xx/5xx requests do not, and an optional monthly spending limit is available. The integration remains unimplemented: no flight UI, adapter, or recommendations changed. |
| 2026-11-05 | Implemented Step 7A's disabled-by-default Ignav usage guard with persistent MongoDB reservations/operation records, atomic global budget protection, canonicalized result caching, duplicate coalescing, per-user throttling, conservative ambiguous-outcome accounting, and an allowlisted authenticated usage endpoint. Added mock-only coverage for success/failure accounting, caching and parameter isolation, expiry, concurrency, rate limits, disabled mode, endpoint access, persistence, ledger failure, and redaction; all 26 backend tests and the backend production TypeScript build pass. No live Ignav request or credential use occurred; no flight adapter/UI or frontend behavior was added. |
| 2026-11-05 | Runtime-verified Step 7A using the production backend process and a disposable MongoDB: health/readiness passed; `GET /api/flights/usage` returned 401 anonymously, 403 to a normal authenticated user, and 200 to an allowlisted admin with the complete safe summary. Identical mock searches coalesced through the persisted cache; confirmed usage, cache counters, and admin access persisted after restarting the backend against the same isolated database. Effective settings were live disabled, allowance 1000, internal limit 800, initial estimate 2, and 30-minute cache TTL. Backend tests passed 26/26, backend production TypeScript build passed, frontend TypeScript/production build passed, and `git diff --check` passed. No live Ignav calls were made; provider connectivity and authoritative balance were not tested in this verification. |
| 2026-11-05 | Implemented Step 7B's authenticated backend-only one-way Ignav search adapter and request validator. Live calls use the documented `POST /api/fares/one-way` request, server-only `X-Api-Key`, normalized provider fields, and the Step 7A reservation/cache/rate-limit path. Development/test use an explicitly marked empty mock result while production remains unavailable unless the live switch is enabled. The isolated backend suite passed 37/37; mock-transport coverage includes mapping, auth/validation, cache/coalescing, parameter and mock/live separation, empty results, definitive failures, malformed responses, timeout reservations, disabled mode, exhausted capacity, and missing credentials. The frontend/backend production builds and `git diff --check` passed. Effective local configuration was live disabled, allowance 1000, internal limit 800, initial estimate 2, with the key present in process environment; its value was not displayed. The safe environment example contains placeholders, and the ignored local `.env` was not modified. No live Ignav request was made; provider connectivity and authoritative balance were not re-tested. Booking links, UI integration, and recommendation changes remain out of scope. |

## Next recommended implementation step

Continue Phase 3 by verifying the disabled Ignav adapter in a controlled,
authorized live environment before enabling it, then consider a flight UI only
after provider terms, coverage, result freshness, and price semantics are
reviewed. Booking-link integration, provider-backed recommendations, other
provider adapters, and complete price breakdowns remain separate work. Do not
enable live labels until those integrations and data claims are verified.
Separately, configure deployment-managed Atlas/JWT secrets and resolve account
recovery, revocation, trip edit/delete UI, retention, and erasure policies.
