ALTER TABLE "usage_records"
  DROP COLUMN IF EXISTS "total_tokens",
  DROP COLUMN IF EXISTS "input_cost",
  DROP COLUMN IF EXISTS "output_cost",
  DROP COLUMN IF EXISTS "total_cost";

ALTER TABLE "customers" ALTER COLUMN "user_id" DROP DEFAULT;
ALTER TABLE "usage_records" ALTER COLUMN "user_id" DROP DEFAULT;

DELETE FROM "model_pricing" WHERE "model_name" = 'default';
