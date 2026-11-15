ALTER TABLE "usage_records"
  ADD COLUMN IF NOT EXISTS "record_fingerprint" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "usage_records_user_id_record_fingerprint_key"
  ON "usage_records"("user_id", "record_fingerprint")
  WHERE "record_fingerprint" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "import_batches" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "source_name" TEXT NOT NULL,
  "source_type" TEXT NOT NULL,
  "total_records" INTEGER NOT NULL,
  "inserted_records" INTEGER NOT NULL,
  "duplicate_records" INTEGER NOT NULL,
  "unpriced_records" INTEGER NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "import_batches_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "import_batches_user_id_created_at_idx"
  ON "import_batches"("user_id", "created_at");
