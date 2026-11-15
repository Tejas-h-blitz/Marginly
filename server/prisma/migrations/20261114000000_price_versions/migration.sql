CREATE TABLE IF NOT EXISTS "price_versions" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "model_name" TEXT NOT NULL,
  "cost_per_1k_input" DECIMAL(20, 10) NOT NULL,
  "cost_per_1k_output" DECIMAL(20, 10) NOT NULL,
  "effective_from" TIMESTAMPTZ(3) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "price_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "price_versions_user_id_model_name_effective_from_key"
  ON "price_versions"("user_id", "model_name", "effective_from");

CREATE INDEX IF NOT EXISTS "price_versions_model_name_effective_from_idx"
  ON "price_versions"("model_name", "effective_from");

INSERT INTO "price_versions" (
  "id",
  "user_id",
  "model_name",
  "cost_per_1k_input",
  "cost_per_1k_output",
  "effective_from"
)
SELECT
  gen_random_uuid()::text,
  '__global__',
  lower(trim("model_name")),
  "cost_per_1k_input"::DECIMAL(20, 10),
  "cost_per_1k_output"::DECIMAL(20, 10),
  TIMESTAMPTZ '1970-01-01 00:00:00+00'
FROM "model_pricing"
WHERE "cost_per_1k_input" IS NOT NULL
  AND "cost_per_1k_output" IS NOT NULL
ON CONFLICT ("user_id", "model_name", "effective_from") DO NOTHING;

ALTER TABLE "model_pricing"
  ALTER COLUMN "cost_per_1k_input" DROP NOT NULL,
  ALTER COLUMN "cost_per_1k_output" DROP NOT NULL;
