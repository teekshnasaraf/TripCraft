# TripCraft Implementation Plan

This is the master project tracking document. Update the relevant phase,
status, development log, and next-step sections after every significant
implementation; preserve the history rather than replacing the plan.

## Current project status

- **Current phase:** Phase 1 – Project Foundation and Frontend Setup (Steps 1–3
  complete).
- **Overall status:** Foundation, reusable design system, and responsive landing
  page are implemented and locally verified. Phase 2 has not started.
- **Booking model:** TripCraft will link users to external booking platforms;
  TripCraft will not process bookings or payments.
- **Implemented product surface:** Informational landing page, locally
  validated frontend-only trip-search preview, development design-system
  preview, and `GET /api/health`.
- **Not implemented:** Authentication, actual trip search or persistence,
  travel-provider calls, AI, optimisation, maps, booking, or payment.

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
  - Define user and trip schemas, indexes, validation, and migration/seed policy.
  - Implement password hashing and token/session lifecycle with safe secret
    handling and authorization middleware.
  - Add authentication/profile/trip REST routes, controllers, and services.
  - Add frontend forms, validation, route protection, trip list, and trip editor.
  - Define deletion, retention, and personal-data handling behavior.
- **Relevant frontend modules:** `features/auth/`, `features/profile/`,
  `features/trips/`, shared form components, API services.
- **Relevant backend modules:** `models/`, `services/auth/`, `services/trips/`,
  `controllers/`, `routes/`, `middleware/`.
- **Required external integrations:** MongoDB deployment and secret management;
  email provider only if account verification or recovery is selected.
- **Expected outcome:** Users can securely manage their account and trips.
- **Dependencies on previous phases:** Phase 1.
- **Testing requirements:** Unit, API integration, authorization/ownership,
  validation, password handling, and frontend form/route tests.
- **Current status:** Pending.

### PHASE 3 – Travel API Integrations

- **Objective:** Retrieve normalized flight, hotel, and activity options through
  replaceable provider adapters.
- **Features to implement:** Search request models, provider adapters,
  normalization, provider availability/error handling, result freshness.
- **Detailed implementation tasks:**
  - Select providers based on access, geography, terms, and data coverage.
  - Define common flight, accommodation, and activity contracts.
  - Implement independent adapters and secret/configuration boundaries.
  - Add backend search services with timeouts, rate limits, and resilient
    provider-specific error reporting.
  - Add frontend search inputs and sourced-result presentation.
- **Relevant frontend modules:** `features/flights/`, `features/hotels/`,
  `features/activities/`, `services/`.
- **Relevant backend modules:** `services/flights/`, `services/hotels/`,
  `services/activities/`, `integrations/providers/`, `types/`.
- **Required external integrations:** Approved flight, hotel, and activity
  APIs; credentials are selected and provisioned in this phase.
- **Expected outcome:** Comparable, normalized search results with provider
  attribution and outbound booking links.
- **Dependencies on previous phases:** Phase 1; Phase 2 for user-owned saved
  searches and trips.
- **Testing requirements:** Adapter contract tests, mocked provider tests,
  timeout/error/rate-limit tests, and end-to-end search checks.
- **Current status:** Pending.

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
- **Current status:** Pending.

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

- **Completed tasks:** Phase 1 foundation, design system, and landing page
  implementation and verification.
- **In progress:** None.
- **Pending tasks:** All work in Phases 2–8.

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
| REST communication | Establishes a simple explicit boundary between frontend and backend. |
| Mongoose connection is optional during local development | The health service and initial API can run before database credentials exist. |
| Provider adapters normalise external offers | Planned integration isolates provider APIs and supports comparison against shared contracts. |
| External booking links, not in-app booking | Keeps the initial product out of payment and reservation processing. |
| No authentication, AI, or provider SDKs in Phase 1 | Avoids unused dependencies and premature integration choices. |

## Dependencies

- Node.js and npm for workspaces, development, and builds.
- MongoDB only when persistence is enabled; no database is required for the
  initial development server.
- External provider/AI/map services are not configured and require separate
  selection, access, and credentials in later phases.

## Known limitations

- The frontend root is an informational landing page, not a functional trip
  planner.
- The trip form is a browser-only preview; no trip is created, saved, or searched
  and currency selection is not yet available.
- Destination cards are editorial samples, not live offers; price, availability,
  ratings, and provider search are intentionally absent.
- Editorial image URLs require network access; unavailable images show a local
  placeholder rather than breaking the layout.
- Sign-in and get-started do not create an account; sign-in reports that accounts
  are coming soon and get-started scrolls to the local form.
- Navbar/footer product and legal destinations are placeholders until their
  corresponding routes and policies exist.
- The design preview is available only in the Vite development build.
- No dedicated automated component-test runner is configured; this step was
  validated with TypeScript/production builds and browser checks.
- The API exposes only health status and does not persist trips.
- MongoDB is not required by the health route; database availability is reported
  as configured/connected, but readiness is not a separate endpoint.
- `JWT_SECRET` is reserved for authentication and is not used by the API yet.
- No booking, payment, provider, AI, map, or price-tracking capability exists.

## Development log

| Date | Update |
| --- | --- |
| 2026-11-03 | Started Phase 1 repository foundation, frontend/backend scaffolding, and documentation. |
| 2026-11-03 | Installed workspace dependencies (npm audit: 0 vulnerabilities); frontend and backend builds passed. Frontend returned HTTP 200; backend health returned HTTP 200 without MongoDB and an unknown route returned HTTP 404. |
| 2026-11-03 | Published the Phase 1 foundation to GitHub `main` as commit `eb3d2da35366eedd655c34277b08e50a9ced939d`. |
| 2026-11-03 | Completed Phase 1 Step 2: semantic Tailwind v4 design tokens, reusable UI/common/layout components, and dev-only design preview; builds and browser checks passed. |
| 2026-11-03 | Completed Phase 1 Step 3: responsive landing page, controlled local-only trip form, six editorial destinations, informational sections and CTAs; verified form/nav interactions, remote imagery, 390/768/1440 px layouts, clean browser console, and production exclusion of the design preview. Frontend and backend builds passed; no dependencies added. |
| 2026-11-03 | Completed the reusable frontend design system, semantic CSS/Tailwind v4 tokens, common and layout components, and a development-only preview. TypeScript and production builds passed; browser checks at 390, 768, and 1440 px found no horizontal overflow or console errors, and keyboard navigation worked. Production output excludes the preview route and chunk. No dependencies were added. |

## Next recommended implementation step

Begin Phase 2 by defining the user/trip data contracts and authentication
requirements before implementing persistence or routes.
