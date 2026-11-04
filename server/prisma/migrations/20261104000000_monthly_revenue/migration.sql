ALTER TABLE "customers"
  ADD COLUMN IF NOT EXISTS "monthly_revenue_usd" DECIMAL(14, 2);
