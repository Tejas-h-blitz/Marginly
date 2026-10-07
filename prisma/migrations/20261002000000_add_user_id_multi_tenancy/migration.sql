-- AlterTable
ALTER TABLE "customers" ADD COLUMN "user_id" TEXT NOT NULL DEFAULT 'demo-user';

-- AlterTable
ALTER TABLE "usage_records" ADD COLUMN "user_id" TEXT NOT NULL DEFAULT 'demo-user';

-- DropForeignKey
ALTER TABLE "usage_records" DROP CONSTRAINT IF EXISTS "usage_records_customer_id_fkey";

-- DropIndex
DROP INDEX IF EXISTS "customers_customer_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "customers_user_id_customer_id_key" ON "customers"("user_id", "customer_id");

-- CreateIndex
CREATE INDEX "customers_user_id_idx" ON "customers"("user_id");

-- CreateIndex
CREATE INDEX "usage_records_user_id_idx" ON "usage_records"("user_id");

-- CreateIndex
CREATE INDEX "usage_records_user_id_customer_id_idx" ON "usage_records"("user_id", "customer_id");

-- AddForeignKey
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_user_id_customer_id_fkey" FOREIGN KEY ("user_id", "customer_id") REFERENCES "customers"("user_id", "customer_id") ON DELETE CASCADE ON UPDATE CASCADE;
