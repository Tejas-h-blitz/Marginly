# Marginly — Product & Architecture Specification

> **Status:** Current implementation, reviewed November 3, 2026. This document distinguishes working application behavior from static previews and future work.

## 1. Product summary

Marginly is an import-based LLM usage cost dashboard for SaaS teams. It groups usage records by customer, estimates spend from input/output token counts and the active model pricing catalog, and helps identify accounts responsible for a large share of priced spend.

The product currently analyzes uploaded or pasted data. It does not collect usage directly from OpenAI, Anthropic, Google, or an observability gateway.

## 2. Current application

### Public landing page

The active landing page contains:

- A responsive header with theme control and Clerk sign-in.
- A hero section with a small interactive margin calculator. Its displayed rates and results are illustrative, not connected to imported account data or provider APIs.
- A product dashboard preview with static sample figures.
- A model-rate ticker and a footer.

The hero calculator and dashboard preview are marketing UI; they do not represent a live customer account or dashboard query.

### Authenticated dashboard

After sign-in, a user can:

- Import a CSV or paste CSV/JSON usage rows.
- Load the bundled sample CSV into their own account.
- Review cost and token summary cards, a customer spend chart, and a customer table.
- View the active model pricing catalog.
- Export the customer breakdown as CSV or clear their own imported usage data.

The dashboard includes:

- Total priced cost, top customer, active account count, token volume, and average cost per priced request.
- A top-three spend concentration indicator when there are at least eight customers; it flags a concentration risk at 70% or more of priced spend.
- An unpriced-model warning listing unrecognized model names and request counts.
- A chart of up to eight customers.
- A customer table with search, sorting, spend-share filters, and customer ID copying.

## 3. Authentication and data access

- Clerk provides the frontend sign-in/sign-up flow and verified server sessions.
- Every `/api/*` endpoint requires a Clerk-authenticated `userId`; missing or invalid authentication is rejected with HTTP 401. `/health` is public.
- If valid Clerk server keys are not configured, API access remains unavailable and returns 401. There is no demo identity or `demo-user` fallback.
- Customer and usage records are scoped to the authenticated Clerk user in application queries and writes.
- The sample-data endpoint is protected by the same authentication and adds sample rows to the signed-in user's account.
- The workspace selector is a local UI preference, not team membership, authorization, or a separately enforced tenant.

The API currently exposes:

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Public health response |
| `GET` | `/api/summary` | User-scoped dashboard totals and unpriced-model counts |
| `GET` | `/api/customers` | User-scoped customer cost breakdown |
| `GET` | `/api/pricing` | Active model pricing catalog |
| `POST` | `/api/upload` | Upload and import CSV or JSON file data |
| `POST` | `/api/paste` | Import pasted CSV or JSON data |
| `POST` | `/api/load-sample` | Import bundled sample data for the signed-in user |
| `POST` | `/api/clear` | Delete the signed-in user's usage and customer rows |
| `GET` | `/api/export` | Download the signed-in user's customer breakdown as CSV |

## 4. Import and pricing behavior

### Accepted usage data

CSV uploads and pasted content, or JSON arrays of objects, are supported. Recognized fields include customer ID, timestamp, model name, input token count, and output token count, with common provider-specific aliases. Customer ID is required; timestamps may be absent or invalid. Token values are parsed as non-negative integer counts.

### Model resolution and cost

- Model names are matched against the active pricing catalog after normalization, including supported provider/resource prefixes and version/date suffixes.
- Rates are USD per 1,000 text input and output tokens. Image, audio, video, and other modality-specific charges are outside the current calculation.
- The active catalog comes from database pricing rows when present; when the database pricing table is empty, the built-in catalog is used.
- Records whose model cannot be resolved are unpriced. They do not contribute to cost totals; the dashboard lists each model and its request count. Import responses report the number of unpriced records in that import.
- Only token counts, model names, customer IDs, and timestamps are persisted for usage records. Cost is recalculated at query time from the current pricing catalog. Adding a rate for a previously unpriced model can therefore make existing records priced in subsequent queries.
- Historical rates are not versioned. Changing a model's current rate changes the recalculated cost for past records. Effective-date pricing is a future requirement for accurate historical billing.

## 5. Analytics and export details

- Customer totals include all requests and tokens. Costs include only records with a recognized active price.
- Average cost per request uses priced requests as its denominator.
- Customer spend percentages use total priced cost.
- The concentration indicator considers the top three customers and appears only when there are at least eight customers; its threshold is 70%.
- CSV export columns are:

  `customer_id,total_requests,priced_requests,total_input_tokens,total_output_tokens,total_tokens,total_cost_usd,avg_cost_per_request_usd,percent_of_total_cost`

## 6. Architecture and deployment

| Area | Implementation |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS, Recharts |
| Backend | Node.js, Express, TypeScript |
| Authentication | Clerk React and Express SDKs |
| Data access | Prisma Client and a PostgreSQL-compatible PGlite fallback |
| Schema | `server/prisma/schema.prisma` |
| Production serving | Express serves the built client from `client/dist` when present |

The root `npm run build` command builds the client, generates the Prisma client, then compiles the server. `npm start` starts the server on port 3001 by default. Configure Clerk client/server keys and `DATABASE_URL` for the intended environment.

When using the embedded PGlite fallback, its data directory is `dev-postgres-data`. External PostgreSQL deployments must have the current schema/migrations applied; the embedded fallback migration behavior is not a substitute for deploying migrations to a hosted database.

## 7. Data model

The active Prisma schema defines:

- **Customer:** user ID, customer ID, timestamps; unique per `(userId, customerId)`.
- **UsageRecord:** user ID, customer ID, optional event timestamp, original model name, input tokens, output tokens.
- **ModelPricing:** model key, display name, provider, input and output rates.

Usage costs and total-token values are derived, not stored. The November 2026 migration removes legacy persisted cost/token-total columns and synthetic user-ID defaults.

## 8. Not implemented

Marginly is an early functional MVP, not a production-scale or enterprise-ready SaaS product. The presence of a unified deployment, polished UI, and Clerk authentication should not be read as evidence of operational readiness or compliance.

- Real-time ingestion, provider API connections, or integrations with Langfuse/Helicone.
- Stripe checkout, subscription enforcement, or billing administration.
- Team accounts, invitations, roles, or shared workspaces.
- PostgreSQL row-level security policies. Tenant separation is currently enforced by application-level user scoping.
- Slack, email, or other outbound alerts.
- Effective-date pricing or historical price snapshots.
- A dashboard UI for editing pricing. The pricing dialog is read-only; the server can use seeded or database-configured rates.
- Production readiness claims such as SOC 2 certification, SAML, or multi-region failover.

## 9. Verification status

For the November 3, 2026 hardening pass, the root production build completed successfully: client TypeScript/Vite build, Prisma Client generation, and server TypeScript compilation. An unauthenticated route check returned HTTP 401 for all eight `/api` endpoints and HTTP 200 for `/health`.

These checks verify compilation and the tested authentication boundary; they do not constitute a full production deployment, external database migration, load test, or security certification.
