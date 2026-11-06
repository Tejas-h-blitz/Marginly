# Marginly — Product & Architecture Specification

> **Status:** Current implementation, reviewed November 6, 2026. This document distinguishes working application behavior from static previews and future work.

## 1. Product summary

Marginly is an import-based LLM usage cost dashboard for SaaS teams. It groups usage records by customer, estimates spend from input/output token counts and the active model pricing catalog, and helps identify accounts responsible for a large share of priced spend.

The product currently analyzes uploaded or pasted data. It does not collect usage directly from OpenAI, Anthropic, Google, or an observability gateway.

## 2. Current application

### Public landing page

The public landing page is a responsive, theme-aware product overview. Its sections appear in this order:

1. **Hero:** Explains customer-level LLM token cost analysis, with a primary upload CTA, a link to “How it works,” and a “Free during early access” badge. The primary CTA opens the dashboard for signed-in users or the sign-up flow for signed-out users.
2. **How it works:** Describes exporting usage, uploading or pasting it, and reviewing cost and margin. It includes the accepted usage CSV column example and a downloadable template.
3. **Product preview:** Shows static sample dashboard data, a customer breakdown, an unpriced-model warning, and a cost chart. Its highest-spend example bar uses a dark-blue highlight.
4. **What you get:** Summarizes customer cost, spend share, spend concentration, unpriced-model visibility, monthly margin, and CSV export.
5. **Supported models:** Lists the built-in model catalog rates by provider, with separate input/output text-token prices.
6. **Your data:** Describes stored usage fields, clarifies that prompts and responses are not stored as usage records, and recommends anonymized customer IDs.
7. **Final CTA and footer:** Provides the upload CTA, early-access badge, and real in-page links.

The sticky landing navbar has three centered section links (“How it works,” “Features,” and “Models”), the theme-aware Marginly logo, a theme toggle, and a sign-in or dashboard action. Authenticated users also see their Clerk profile control. The navbar uses an inset, rounded glass treatment over the landing background. The footer also uses the theme-aware brand logo.

The hero uses a balanced, responsive headline aligned with its supporting copy, a primary upload button, a “See how it works” link, and an early-access badge. It also contains a small interactive margin calculator labeled “Illustrative example, not your data.” The calculator uses the shared built-in pricing catalog and an even split of input/output tokens for its estimate. Its values are illustrative only and are not connected to imported account data or provider APIs. The product preview also uses static sample figures and does not represent a live customer account or dashboard query.

The supported-model list and calculator use the same built-in catalog as the server fallback catalog; they do not fetch a user's database-specific pricing rows. A “Give feedback” mail link appears in the final CTA and footer only when `VITE_FEEDBACK_EMAIL` is configured. The landing page does not include an FAQ section, pricing tiers, testimonials, customer logos, or claims of live ingestion.

### Authenticated dashboard

After sign-in, a user can:

- Import a CSV or paste CSV/JSON usage rows, and import customer revenue from a CSV.
- Load the bundled sample CSV into their own account.
- Select a month or All time, then review cost and token summaries, a customer spend chart, and a customer table.
- Set each customer's monthly revenue inline or provide it through a revenue CSV.
- View the active model pricing catalog.
- Export the customer breakdown as CSV or clear their own imported usage data.

For a selected month, the dashboard includes:

- Total revenue, total priced cost, blended margin percentage, unprofitable customer count, active account count, token volume, and average cost per priced request.
- Per-customer margin and margin percentage; negative-margin customers are highlighted. Customers without revenue are omitted from margin totals.
- Warnings for unpriced models (which make displayed margins overstate actual margins) and records with missing or invalid timestamps.

All time shows costs only. Revenue and margin comparisons require a selected month.

Other dashboard features:

- Cost-only totals, top customer, active account count, token volume, and average cost per priced request in All time.
- A top-three spend concentration indicator when there are at least eight customers; it flags a concentration risk at 70% or more of priced spend.
- An unpriced-model warning listing unrecognized model names and request counts.
- Unpriced-model and margin-overstatement notices use a dark-blue visual treatment; the warning meaning and cost-exclusion behavior are unchanged.
- A chart of up to eight customers.
- A customer table with search, sorting, spend-share filters, customer ID copying, and inline monthly revenue editing.

The dashboard navigation uses the theme-aware Marginly logo in a rounded glass panel and retains its existing theme, account, and action controls without the former “SaaS Instrument” label. The dashboard chart retains its amber highlight for the highest-spend customer. The static landing preview uses a dark-blue highlight instead; this is a presentation difference and does not affect chart data or dashboard behavior.

## 3. Authentication and data access

- Clerk provides the frontend sign-in/sign-up flow and verified server sessions.
- Every `/api/*` endpoint requires a Clerk-authenticated `userId`; missing or invalid authentication is rejected with HTTP 401. `/health` is public.
- If valid Clerk server keys are not configured, API access remains unavailable and returns 401. There is no demo identity or `demo-user` fallback.
- Customer and usage records are scoped to the authenticated Clerk user in application queries and writes.
- The sample-data endpoint is protected by the same authentication and adds sample rows to the signed-in user's account.
- There is no workspace or team selector; all records remain scoped to the signed-in user.

The API currently exposes:

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Public health response |
| `GET` | `/api/summary?month=YYYY-MM\|all` | User-scoped monthly or all-time totals, available months, and unpriced-model counts |
| `GET` | `/api/customers?month=YYYY-MM\|all` | User-scoped customer cost and (for a month) margin breakdown |
| `PUT` | `/api/customers/:customerId/revenue` | Set or clear a user's monthly revenue for an owned customer |
| `POST` | `/api/revenue/import` | Import customer monthly revenue from CSV |
| `GET` | `/api/pricing` | Active model pricing catalog |
| `POST` | `/api/upload` | Upload and import CSV or JSON file data |
| `POST` | `/api/paste` | Import pasted CSV or JSON data |
| `POST` | `/api/load-sample` | Import bundled sample data for the signed-in user |
| `POST` | `/api/clear` | Delete the signed-in user's usage and customer rows |
| `GET` | `/api/export?month=YYYY-MM\|all` | Download the signed-in user's customer breakdown as CSV |

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
- Revenue CSVs require `customer_id,monthly_revenue_usd`; customer IDs must already belong to the authenticated user. Revenue is non-negative, accepts up to two decimal places, and is stored once per customer (not versioned by month).
- The import drawer provides usage and revenue CSV templates and advises using anonymized customer IDs rather than emails or names.

## 5. Analytics and export details

- Customer totals include all requests and tokens. Costs include only records with a recognized active price.
- Average cost per request uses priced requests as its denominator.
- Customer spend percentages use total priced cost.
- Month filtering uses UTC calendar-month boundaries. Records with missing or invalid timestamps are included only in All time; their count is reported separately.
- For a month, margin is monthly revenue minus priced cost, and margin percentage is margin divided by revenue. Customers without revenue are excluded from margin totals. Unpriced records are excluded from cost, so their presence means actual margin may be lower than shown.
- All-time exports leave monthly margin and margin-percentage cells blank.
- The concentration indicator considers the top three customers and appears only when there are at least eight customers; its threshold is 70%.
- CSV export columns are:

  `customer_id,total_requests,priced_requests,total_input_tokens,total_output_tokens,total_tokens,monthly_revenue_usd,total_cost_usd,margin_usd,margin_percent,avg_cost_per_request_usd,percent_of_total_cost`

## 6. Architecture and deployment

| Area | Implementation |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS, Recharts |
| Backend | Node.js, Express, TypeScript |
| Authentication | Clerk React and Express SDKs |
| Data access | Prisma Client and a PostgreSQL-compatible PGlite fallback |
| Schema | `server/prisma/schema.prisma` |
| Production serving | Express serves the built client from `client/dist` when present |

The root `npm run build` command builds the client, generates the Prisma client, then compiles the server. `npm start` starts the server on port 3001 by default. Configure Clerk client/server keys and `DATABASE_URL`; production startup fails if `DATABASE_URL` is missing or unreachable, and embedded PGlite is development-only.

When using the embedded PGlite fallback, its data directory is `dev-postgres-data`. External PostgreSQL deployments must have the current schema/migrations applied; the embedded fallback migration behavior is not a substitute for deploying migrations to a hosted database.

## 7. Data model

The active Prisma schema defines:

- **Customer:** user ID, customer ID, nullable monthly revenue in USD, timestamps; unique per `(userId, customerId)`.
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

The November 5–6, 2026 landing-page and dashboard presentation updates passed the client TypeScript check and Vite production build.

These checks verify compilation and the tested authentication boundary; they do not constitute a full production deployment, external database migration, load test, or security certification.
