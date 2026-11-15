# Marginly

A minimal, high-utility web application designed for AI SaaS founders to track per-customer LLM API costs (OpenAI & Anthropic), identify high-expenditure accounts eating into gross margins, and export cost breakdown reports.

---

## Tech Stack (Locked Production Stack)

- **Language**: TypeScript across both backend and frontend
- **Backend**: Node.js + Express (TypeScript)
- **ORM**: Prisma
- **Database**: PostgreSQL (configured via `.env`, ready for local PostgreSQL, Supabase, Neon, etc.)
- **Frontend**: React + Vite (TypeScript)
- **Styling**: Tailwind CSS
- **Charts**: Recharts (horizontal bar chart showing customer cost distribution)

---

## Quick Start

### 1. Configure Environment
Copy `.env.example` to `.env` (or customize `.env`):

```bash
# PostgreSQL Connection String (local instance, Supabase, Neon, etc.)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_cost_tracker?schema=public"

# Backend Server Port
PORT=3001

# Frontend URL
CLIENT_URL="http://localhost:5173"
```

> **Zero-Setup Local Dev**: If you don't have a local PostgreSQL daemon or Docker running on port 5432 yet, the backend automatically runs with an embedded local PostgreSQL engine (`PGlite`) using the exact same PostgreSQL schema and migrations so you can test end-to-end immediately without friction.

### 2. Run the Application

Build the client bundle and server:

```bash
npm run build
```

Configure `VITE_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` in `.env`, then start the application:

```bash
npm start
```

On Windows, [run.bat](./run.bat) builds the app and then starts the server.

Open your browser at:
👉 **http://localhost:3001**

The production server serves the built React frontend and Express API together on this single port. Every `/api/*` endpoint requires a verified Clerk session.

---

## Prisma Database Setup & Migrations

The Prisma schema is defined in [`server/prisma/schema.prisma`](server/prisma/schema.prisma) with models:
- `Customer`: Unique customer account identifiers and timestamps.
- `UsageRecord`: Individual request logs (`userId`, `customerId`, `timestamp`, `modelName`, `inputTokens`, `outputTokens`). Costs are recalculated from current pricing at query time and are not stored.
- `ModelPricing`: Configurable per-model pricing rates (`modelName`, `displayName`, `provider`, `costPer1kInput`, `costPer1kOutput`).

### Useful Prisma Commands:
```bash
# Generate Prisma Client
npm run prisma:generate --prefix server

# Run migrations against your PostgreSQL database
npm run prisma:migrate --prefix server

# Push schema directly (prototyping)
npm run prisma:push --prefix server

# Seed the model pricing matrix
npm run seed --prefix server
```

---

## Instant Testing with Sample Data

The application includes sample data with **8 customer accounts** across mixed OpenAI and Anthropic models ([`data/sample_usage.csv`](data/sample_usage.csv)):

1. Open the dashboard at **[http://localhost:3001](http://localhost:3001)**.
2. Click **"Load Sample Data"** in the top navigation bar.
3. Instantly see:
   - **Summary KPI Cards**: Total LLM spend, active customer count, API requests, token volume, and top spender highlighted.
   - **Recharts Bar Chart**: Visual comparison of spend across customer accounts.
   - **Customer Breakdown Table**: Sorted by total cost descending with spend share progress bars and search filter.
   - **CSV Export**: Click "Export CSV" to download the breakdown report.

---

## Usage CSV / JSON Import Format

Import usage logs via drag-and-drop or by pasting into the **Paste Raw Data** tab.

### CSV Format
The customer ID, model name, and input/output token fields are required. The timestamp is optional.

```csv
customer_id,timestamp,model_name,input_tokens,output_tokens
cust_acme_corp,2026-09-22T09:15:00Z,gpt-4o,24500,4200
cust_pixel_ai,2026-09-22T09:30:00Z,claude-3-5-sonnet,31200,5800
cust_starter_dev,2026-09-22T10:00:00Z,gpt-4o-mini,3100,520
```

### JSON Format
```json
[
  {
    "customer_id": "cust_acme_corp",
    "timestamp": "2026-09-22T09:15:00Z",
    "model_name": "gpt-4o",
    "input_tokens": 24500,
    "output_tokens": 4200
  }
]
```

---

## Model Pricing

The model catalog stores display/provider metadata; effective-dated rates are stored separately in `price_versions`. Global rates and account-specific overrides are resolved at query time from each request's token counts and timestamp.
- **OpenAI**: `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, `gpt-4`, `gpt-3.5-turbo`, `o1`, `o1-mini`, `o3-mini`
- **Anthropic**: `claude-3-7-sonnet`, `claude-3-5-sonnet`, `claude-sonnet-4`, `claude-3-5-haiku`, `claude-3-haiku`, `claude-3-opus`
- Click **"Pricing Rates"** in the navbar to view active rates.
- Account-specific model rates can be added, edited, and removed in the pricing dialog; the form accepts USD per million tokens and an optional effective date.

Usage records with models that do not match an active pricing entry are marked unpriced, excluded from cost totals, and listed with request counts in a dashboard warning. Each import reports how many records were unpriced. Costs for priced records are recalculated from stored token counts and the current rates when usage data is queried.

## Revenue, customer detail, and imports

- Revenue values are versioned by effective month. Editing a selected month affects that month and later months until a subsequent version is entered; earlier months remain unchanged.
- Import batches record source, counts, duplicates, unpriced records, and time. Re-imports are user-scoped and idempotent.
- Customer details show model/request totals, recent usage, and revenue history. Merging customers is transactional: usage duplicates collapse, and the target customer's revenue wins same-month conflicts.
- CSV/JSON usage files and pasted content are limited to 10 MiB and processed in memory. Marginly persists supported customer/model/token/timestamp fields, revenue versions, import metadata, and custom rates—not prompt or completion text. Do not include prompt contents or secrets in imports.
- The dashboard clear action permanently removes the signed-in account's usage records, customer/revenue history, import history, and custom rates from the active database. It does not delete the Clerk account or guarantee removal of operational logs or backups.

## Privacy and Terms drafts

The landing-page footer links to factual Privacy and Terms drafts. They are explicitly marked **Draft — legal review required**. Before launch, the service operator must confirm hosting/database providers, processing locations, log and backup retention, jurisdiction, contact information, and any required legal terms.

## Tests

Run the production build and focused regression suites:

```powershell
npm run build
$env:MARGINLY_TEST_PGLITE_DIR = "C:\path\to\an\isolated\database-copy"
npm run test:security
npm run test:pricing
npm run test:imports
npm run test:revenue
npm run test:customers
npm run test:stress
```

Database tests require `MARGINLY_TEST_PGLITE_DIR` to point to a disposable, isolated copy. Never point it to production or the active local database. The stress suite runs its 35 checks in UTC, America/Los_Angeles, Asia/Kolkata, and Pacific/Auckland.
