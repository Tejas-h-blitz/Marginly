ALTER TABLE "usage_records"
  ADD COLUMN IF NOT EXISTS "record_fingerprint" TEXT,
  ADD COLUMN IF NOT EXISTS "import_batch_id" TEXT;

CREATE INDEX IF NOT EXISTS "usage_records_user_id_import_batch_id_idx"
  ON "usage_records"("user_id", "import_batch_id");

CREATE TABLE IF NOT EXISTS "import_batches" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "source_name" TEXT NOT NULL,
  "source_type" TEXT NOT NULL,
  "total_records" INTEGER NOT NULL,
  "inserted_records" INTEGER NOT NULL,
  "duplicate_records" INTEGER NOT NULL,
  "within_file_duplicates" INTEGER NOT NULL DEFAULT 0,
  "unpriced_records" INTEGER NOT NULL,
  "duplicate_mode" TEXT NOT NULL DEFAULT 'skip',
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "import_batches_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "import_batches"
  ADD COLUMN IF NOT EXISTS "within_file_duplicates" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "duplicate_mode" TEXT NOT NULL DEFAULT 'skip';

CREATE INDEX IF NOT EXISTS "import_batches_user_id_created_at_idx"
  ON "import_batches"("user_id", "created_at");

DROP INDEX IF EXISTS "usage_records_user_id_record_fingerprint_key";
