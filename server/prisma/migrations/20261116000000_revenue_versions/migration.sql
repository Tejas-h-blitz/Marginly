CREATE TABLE IF NOT EXISTS "revenue_versions" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "customer_id" TEXT NOT NULL,
  "monthly_revenue_usd" DECIMAL(14, 2),
  "effective_month" DATE NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "revenue_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "revenue_versions_user_id_customer_id_effective_month_key"
  ON "revenue_versions"("user_id", "customer_id", "effective_month");

CREATE INDEX IF NOT EXISTS "revenue_versions_user_id_effective_month_idx"
  ON "revenue_versions"("user_id", "effective_month");

INSERT INTO "revenue_versions" (
  "id",
  "user_id",
  "customer_id",
  "monthly_revenue_usd",
  "effective_month"
)
SELECT
  gen_random_uuid()::text,
  "user_id",
  "customer_id",
  "monthly_revenue_usd",
  date_trunc('month', CURRENT_DATE)::date
FROM "customers"
WHERE "monthly_revenue_usd" IS NOT NULL
ON CONFLICT ("user_id", "customer_id", "effective_month") DO NOTHING;
