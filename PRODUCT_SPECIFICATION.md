# Marginly — Product & Architecture Specification

> **Status:** Implementation-aligned product and architecture reference. Verify deployment-specific privacy and terms details before publication.

---

## 1. Product Summary

**Marginly** is a specialized unit-economics and LLM cost-tracking dashboard for SaaS engineering and finance teams. It bridges the gap between raw LLM token consumption and business gross margins by:

1. Ingesting customer-level usage logs (CSV or JSON) exported from AI gateways or provider dashboards (OpenAI, Anthropic, Google Gemini, OpenRouter, Helicone, LiteLLM, or custom proxies).
2. Normalizing model identifiers and calculating exact expenditure dynamically using an active multi-provider pricing catalog.
3. Correlating token expenditure against customer recurring contract revenue to reveal customer-level gross margins, identify spend concentration, and flag unprofitable ("negative-margin") accounts.

Marginly operates on an **import-based ingestion model**; it does not require direct runtime API proxying or invasive webhook integrations into production LLM inference pipelines.

---

## 2. Complete Technology Stack

### Frontend Architecture
- **Framework & Language:** React 18.3 (`react`, `react-dom`), TypeScript 5.6
- **Build System & Bundler:** Vite 5.4 with `@vitejs/plugin-react`
- **Styling & Design System:** Tailwind CSS 3.4 with custom typography, dark/light theme support, PostCSS, Autoprefixer, and custom cubic-bezier micro-interactions
- **Authentication Client:** `@clerk/clerk-react` (v5.61) and `@clerk/themes` for themed modal authentication
- **Data Visualization & Charts:** Recharts 2.12 (responsive SVG bar charts with custom tooltips and spend concentration highlights)
- **Icons & UI Micro-components:** Inline SVG icons, responsive slide-over drawers, custom modals, and accessible focus management

### Backend Architecture
- **Runtime & Language:** Node.js (v20+ / v22), Express 4.21, TypeScript 5.6
- **Development Execution:** `tsx` for TypeScript execution and hot-reloading
- **Authentication Middleware:** `@clerk/express` (v2.1) verifying session tokens against Clerk's JWKS
- **File & Data Parsing:** `multer` in-memory multipart upload and `csv-parse` for CSV processing; request and file payloads are capped at 10 MiB
- **CORS & Utilities:** `cors`, `dotenv`

### Database & Storage
- **ORM & Schema Engine:** Prisma ORM 5.22 (`@prisma/client`, `prisma`)
- **Primary Database:** PostgreSQL 14+ via standard connection pooling (`DATABASE_URL`)
- **Embedded Developer Engine:** `@electric-sql/pglite` (v0.5.8), used as a zero-dependency local PostgreSQL-compatible fallback with automatic application of the project's SQL migrations

### Quality, Security & Testing Tooling
- **Auth & JWT Security Suite:** `test-auth-security.mjs` (13-point security verification suite enforcing token validity, tamper prevention, and environment guards)
- **End-to-End Test Harness:** `test-e2e.mjs` (validates end-to-end user workflows, file imports, revenue updates, and export fidelity)
- **Stress & UTC Date Suite:** `test-stress-utc.mjs` and `test-stress-worker.mjs` (verifies UTC calendar-month boundary calculations and high-volume dataset parsing)

---

## 3. Product Features & User Experience

### 3.1 Public Landing Page
The landing page provides a theme-aware, responsive product overview with zero mock data clutter:
1. **Sticky Header:** Theme toggle (dark/light), brand logo, section anchors (*How it works*, *Features*, *Models*), and an authentication entry point (Sign In / Open Dashboard).
2. **Hero Section:** Headline explaining customer unit economics, primary CTA button, early-access badge, and an interactive illustrative margin calculator demonstrating how token counts and contract prices determine gross margin.
3. **How It Works:** 3-step breakdown detailing log export, drag-and-drop ingestion, and automated unit-economics analysis.
4. **Product Showcase:** Live component preview displaying static sample data across KPI summary cards, a data quality alert strip, a customer cost distribution chart, and a sample customer table.
5. **What You Get:** Feature cards covering spend share, spend concentration risk, unpriced model visibility, and instant CSV exports.
6. **Model Rate Ticker & Catalog:** Up-to-date pricing table listing input and output rates across leading providers (OpenAI, Anthropic, Google).
7. **Your Data & Privacy Section:** Describes stored fields, in-memory import processing, tenant isolation, and recommendations for anonymized customer IDs.
8. **Footer:** Navigation links, feedback, and draft Privacy and Terms notices marked for legal review.

### 3.2 Slide-Over Import Drawer (`ImportDrawer.tsx` & `ImportSection.tsx`)
A right-side slide-over modal designed for high-clarity data ingestion:
- **Pinned Header:** Clean title (*Upload Usage Logs*) and description flush with the left boundary, with close button (`×`) and full ESC/backdrop keyboard handling.
- **Segmented 3-Way Tab Switcher:**
  1. **Upload File:** Drag-and-drop dropzone supporting CSV and JSON up to 10 MiB, with browser-side checks and authoritative server-side row validation.
  2. **Paste Text:** Raw monospace text area with format toggle (CSV/JSON), sample row insertion, and immediate parsing.
  3. **Revenue CSV:** Dedicated uploader for importing customer revenue versions, optionally scoped by `effective_month`.
- **Structured Schema Reference Cards:** Compact 2x2 specification grids detailing expected column names (`customer_id`, `model_name`, `input_tokens`, `output_tokens`, `timestamp`), field requirements (`REQ` vs `OPT`), and one-click template download links.
- **Validation & Error Feedback:** The server validates each row and rejects an invalid batch without partial writes. Errors identify rejected row numbers.
- **Privacy Disclosure:** Upload bytes are transmitted to the service and parsed in memory. Marginly persists supported usage fields, revenue, import metadata, and custom rates, not prompt or completion text. Users are told not to include unneeded content.
- **Anchored Demo Action:** Bottom-pinned action enabling users to explore the dashboard instantly with 8 preloaded customer accounts.

### 3.3 Authenticated Dashboard
The core application workspace for analyzing customer LLM expenditure:
- **Month & Timeframe Filter:** Switch between specific UTC calendar months (e.g., `2026-10`) and `All time`.
- **KPI Summary Grid (`KpiGrid.tsx`):**
  - *Monthly View:* Total Revenue, Total Priced Cost, Blended Margin %, Unprofitable Customers count, Active Accounts, Token Volume (Input vs. Output), and Average Cost per Priced Request.
  - *All-Time View:* Cumulative LLM Cost, Top Spend Customer, Active Accounts, Token Volume, and Average Cost per Request.
- **Data Quality & Warning Strip (`DataQualityStrip.tsx`):**
  - Highlights unpriced models that require catalog rate mapping (preventing margin overstatement).
  - Flags untimestamped requests excluded from specific monthly calculations.
- **Spend Concentration Alert:** Flags when the top 3 customers account for ≥70% of total priced LLM spend (active when tracking 8 or more customers).
- **Cost Distribution Chart (`CostChart.tsx`):** Horizontal bar chart ranking top accounts by gross spend with custom tooltips detailing token volume and bill share.
- **Customer Expenditure Table (`CustomerTable.tsx`):**
  - Full account breakdown with sorting on Cost, Tokens, Requests, and Customer ID.
  - Spend-share progress indicators and search/filter by customer ID.
  - Quick-copy button for customer identifiers with temporary visual confirmation.
  - Inline monthly revenue editing with immediate margin recalculation.
  - Highlighting of negative-margin accounts (spend exceeds contract revenue).
- **Customer Details & Merge:** Customer-level model and request details, revenue history, recent usage, and a transactional merge flow. Duplicate usage rows collapse; target revenue wins same-month conflicts.
- **Model Pricing Dialog (`PricingModal.tsx`):** Shows active and upcoming global prices, account-specific effective-dated rates, and supports custom-rate add/edit/delete in USD per million tokens.
- **Export & Maintenance Actions:**
  - One-click CSV export of customer margins with the pricing basis disclosed.
  - Account-scoped clear action removes usage, customers/revenue, import history, and custom rates atomically.

---

## 4. Ingestion, Model Resolution & Margin Calculation

### 4.1 Accepted Schema & Aliases
Each usage row requires a customer ID, model identifier, and non-negative whole-number input/output token counts. Timestamps are optional; when supplied they must be valid. Accepted aliases include:
- **Customer ID:** `customer_id`, `customerid`, `customer`, `user_id`, `client_id` (Required)
- **Model Name:** `model_name`, `model`, `engine` (Required)
- **Input Tokens:** `input_tokens`, `prompt_tokens`, `tokens_in`, `input` (Required)
- **Output Tokens:** `output_tokens`, `completion_tokens`, `tokens_out`, `output` (Required)
- **Timestamp:** `timestamp`, `created_at`, `date`, `time` (Optional; ISO 8601 UTC string)

### 4.2 Dynamic Query-Time Cost Calculation
- Token counts are stored as raw integers (`input_tokens`, `output_tokens`).
- Dollar costs are **not** persisted as static numbers in usage rows. They are calculated at query time from token counts and the effective-dated `PriceVersion` rate:
  $$\text{Record Cost} = \left(\frac{\text{input\_tokens}}{1000} \times \text{costPer1kInput}\right) + \left(\frac{\text{output\_tokens}}{1000} \times \text{costPer1kOutput}\right)$$
- Account-specific rates take precedence over global catalog rates. A model without an effective rate yields a null cost, is excluded from cost totals, and appears in the dashboard's unpriced-model warning with a request count.
- Existing records are recalculated on query when pricing versions change. Version history records effective dates; price changes are not retroactively applied before their effective date.
- Untimestamped usage is costed using the rate effective at query time and appears only in the all-time period view.

### 4.3 Margin & Unit Economics Formulations
For any customer $i$ in a selected month:
- $\text{Priced Cost}_i = \sum \text{Record Cost}$ (for all recognized models in that month)
- $\text{Margin}_i = \text{Monthly Revenue}_i - \text{Priced Cost}_i$
- $\text{Margin \%}_i = \frac{\text{Margin}_i}{\text{Monthly Revenue}_i} \times 100$
- **Blended Margin %:** Calculated across all customers who have revenue entered:
  $$\text{Blended Margin \%} = \frac{\sum (\text{Revenue}_i - \text{Priced Cost}_i)}{\sum \text{Revenue}_i} \times 100$$
- Revenue is effective-month versioned. A later version applies from its effective month until another version supersedes it; setting a null version clears revenue from that month forward without deleting earlier history.
- Accounts without revenue entered are displayed with null margin and excluded from blended margin totals to avoid distorting aggregate business margins.

---

## 5. Security & Multi-Tenant Architecture

1. **Strict User Scoping (Tenant Isolation):**
   - Every API request is authenticated via Clerk JWT session verification.
   - Every `/api` route except `/health` requires a verified Clerk user ID. Test-only signed tokens are accepted only in `NODE_ENV=test` with an explicit `TEST_AUTH_SECRET`.
   - All reads and writes are scoped to that verified user. Custom pricing, import history, customer detail, merges, and clear operations also enforce tenant ownership.
2. **Production Startup Security Guard:**
   - The backend includes a hard startup check: if `TEST_AUTH_SECRET` is detected while `NODE_ENV === 'production'`, the server refuses to boot and immediately exits (`process.exit(1)`).
3. **Automated Security Verification:**
   - Verified via `test-auth-security.mjs` against 13 security invariants, including:
     - Immediate rejection of unauthenticated requests (HTTP 401).
     - Immediate rejection of hand-forged tokens, altered sub claims, and invalid HMAC/RSA signatures.
     - Immediate rejection of expired tokens.
     - Strict isolation of test bypass tokens to `NODE_ENV=test`.
4. **Data Privacy & Draft Policy:**
   - Import payloads are transmitted to the service and processed in memory; supported usage fields, revenue, import metadata, and account-specific pricing rates are persisted, not prompt/completion text.
   - The landing page includes Privacy and Terms drafts marked for legal review. Hosting providers, processing regions, retention details, jurisdiction, and operator contact information must be confirmed before publication.
   - Users are encouraged to provide pseudonymous customer IDs (e.g., `cust_92a1`).

---

## 6. API Route Catalog

All routes except `/health` require an `Authorization: Bearer <clerk_token>` header.

| Method | Path | Description | Access |
|---|---|---|---|
| `GET` | `/health` | Server status and ISO timestamp | Public |
| `GET` | `/api/summary` | Query aggregate metrics, available months, and unpriced models (`?month=YYYY-MM\|all`) | Authenticated |
| `GET` | `/api/customers` | Query customer breakdown, token counts, costs, and margins (`?month=YYYY-MM\|all`) | Authenticated |
| `GET` | `/api/customers/:customerId/detail` | Query customer usage details and revenue history | Authenticated |
| `POST` | `/api/customers/merge` | Transactionally merge an owned source customer into an owned target | Authenticated |
| `PUT` | `/api/customers/:customerId/revenue` | Create or update an effective-month revenue version | Authenticated |
| `POST` | `/api/revenue/import` | Bulk import customer monthly revenue versions from CSV | Authenticated |
| `GET` | `/api/pricing` | Retrieve active, upcoming, and custom pricing rates | Authenticated |
| `POST`, `PUT`, `DELETE` | `/api/custom-rates` | Create, update, and delete account-specific effective-dated rates | Authenticated |
| `GET` | `/api/import-history` | Retrieve account-scoped import batches | Authenticated |
| `POST` | `/api/upload` | Upload and ingest usage log files (multipart CSV / JSON) | Authenticated |
| `POST` | `/api/paste` | Ingest raw pasted CSV text or JSON array payload | Authenticated |
| `POST` | `/api/load-sample` | Seed authenticated user's account with realistic sample customer usage | Authenticated |
| `POST` | `/api/clear` | Atomically purge the account's usage, customer/revenue, import history, and custom rates | Authenticated |
| `GET` | `/api/export` | Download complete customer margin breakdown as CSV (`?month=YYYY-MM\|all`) | Authenticated |

---

## 7. Database Schema (`server/prisma/schema.prisma`)

- `Customer`: unique per user and external customer ID; owns usage records.
- `UsageRecord`: user/customer, optional timestamp, model name, raw input/output token counts, and import fingerprint. Dollar cost is not stored.
- `ModelPricing`: shared model display/provider metadata. Pricing rates are stored separately.
- `PriceVersion`: effective-dated global (`__global__`) and user-specific rates, unique by owner/model/effective date.
- `ImportBatch`: per-user import source, record counts, unpriced count, and creation time.
- `RevenueVersion`: per-user/customer revenue versions by effective month; null versions represent explicit clearing.

The additive migrations are in `server/prisma/migrations/`. Local PGlite applies them at startup; external PostgreSQL deployments must apply them before deploying the corresponding server code.

---

## 8. Development & Build Lifecycle

### Available Scripts (Root `package.json`)
- `npm run dev:client` — Launches Vite development server on `http://localhost:5173`.
- `npm run dev:server` — Launches Express API backend with `tsx watch` on `http://localhost:3001`.
- `npm run build` — Compiles production client (`tsc && vite build`), generates Prisma client, and compiles backend TypeScript.
- `npm start` — Boots production Express server (serves compiled client from `client/dist` and API endpoints on port 3001).
- `npm run test:security` — Executes the 13-point automated auth & JWT security test suite.
- `npm run test:e2e` — Runs the existing end-to-end user workflow test suite.
- `npm run test:pricing` — Checks effective-date boundaries, custom-rate ownership/conversion, recalculation, and CSV cost basis.
- `npm run test:imports` — Checks all-route unauthenticated responses, atomic imports, duplicate handling, limits, and scoped clearing.
- `npm run test:revenue` — Checks effective-month revenue, imports, and isolation.
- `npm run test:customers` — Checks detail/merge ownership, duplicate collapse, target-wins revenue, and transaction rollback.
- `npm run test:stress` — Runs 35 UTC-boundary and regression checks in each of four time zones.

Use an isolated PGlite copy for database tests by setting `MARGINLY_TEST_PGLITE_DIR` while `NODE_ENV=test`; never point tests at production or the active developer database.

---

## 9. Current Status & Verification

The project build runs the client TypeScript/Vite production build, generates Prisma Client, and compiles the server. Focused regression scripts cover pricing versions, imports, revenue history, customer merge/detail, authentication, and multi-time-zone UTC boundaries. Update this section with exact run results before each release; the Privacy and Terms drafts require deployment-specific completion and legal review.
