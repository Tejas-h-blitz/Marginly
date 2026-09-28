# AI Usage Cost Tracker

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

Run this single command:

```bash
npm start
```

*(On Windows, you can also just double-click [run.bat](file:///d:/Marginly/run.bat))*

Open your browser at:
👉 **http://localhost:3001**

Everything (React frontend, Express API backend, Recharts, and PostgreSQL database) runs together on this single port.

---

## Prisma Database Setup & Migrations

The Prisma schema is defined in [`prisma/schema.prisma`](prisma/schema.prisma) with models:
- `Customer`: Unique customer account identifiers and timestamps.
- `UsageRecord`: Individual request logs (`customerId`, `timestamp`, `modelName`, `inputTokens`, `outputTokens`, `totalTokens`, `inputCost`, `outputCost`, `totalCost`).
- `ModelPricing`: Configurable per-model pricing rates (`modelName`, `displayName`, `provider`, `costPer1kInput`, `costPer1kOutput`).

### Useful Prisma Commands:
```bash
# Generate Prisma Client
npm run prisma:generate --prefix server

# Run migrations against your PostgreSQL database
npm run prisma:migrate --prefix server

# Push schema directly (prototyping)
npm run prisma:push --prefix server

# Seed database with pricing matrix & sample data
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
Must include these 5 header columns:

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

## Model Pricing Matrix

Model rates are defined in USD **per 1,000 tokens** and stored in the PostgreSQL `model_pricing` table:
- **OpenAI**: `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, `gpt-4`, `gpt-3.5-turbo`, `o1`, `o1-mini`, `o3-mini`
- **Anthropic**: `claude-3-7-sonnet`, `claude-3-5-sonnet`, `claude-sonnet-4`, `claude-3-5-haiku`, `claude-3-haiku`, `claude-3-opus`
- Click **"Pricing Rates"** in the navbar to view active rates.
