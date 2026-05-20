-- CreateEnum
CREATE TYPE "FinancialPeriodStatus" AS ENUM ('OPEN', 'SOFT_LOCKED', 'HARD_LOCKED');

-- AlterTable
ALTER TABLE "ic_netting_cycle" ADD COLUMN IF NOT EXISTS "counterparty_tenant_id" TEXT;

-- AlterTable
ALTER TABLE "ic_netting_line" ADD COLUMN IF NOT EXISTS "amount" DECIMAL(18,2),
ADD COLUMN IF NOT EXISTS "creditor_tenant_id" TEXT,
ADD COLUMN IF NOT EXISTS "debtor_tenant_id" TEXT,
ADD COLUMN IF NOT EXISTS "description" TEXT,
ADD COLUMN IF NOT EXISTS "from_journal_id" INTEGER,
ADD COLUMN IF NOT EXISTS "netted_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "reference" TEXT,
ADD COLUMN IF NOT EXISTS "status" TEXT,
ADD COLUMN IF NOT EXISTS "tenant_id" TEXT,
ADD COLUMN IF NOT EXISTS "to_journal_id" INTEGER,
ADD COLUMN IF NOT EXISTS "type" TEXT,
ALTER COLUMN "cycle_id" DROP NOT NULL,
ALTER COLUMN "from_company_id" DROP NOT NULL,
ALTER COLUMN "to_company_id" DROP NOT NULL,
ALTER COLUMN "gross_amount" DROP NOT NULL,
ALTER COLUMN "netting_amount" DROP NOT NULL,
ALTER COLUMN "settled_amount" DROP NOT NULL;

-- AlterTable
ALTER TABLE "outbox_events" ADD COLUMN IF NOT EXISTS "idempotency_key" TEXT,
ALTER COLUMN "tenant_id" DROP DEFAULT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "wms_task" (
    "id" SERIAL NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "wave_id" INTEGER NOT NULL,
    "order_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "bin_location" TEXT NOT NULL,
    "quantity" DECIMAL(18,2) NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wms_task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "financial_periods" (
    "id" SERIAL NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "status" "FinancialPeriodStatus" NOT NULL DEFAULT 'OPEN',
    "locked_by" TEXT,
    "locked_at" TIMESTAMP(3),
    "reopened_by" TEXT,
    "reopened_at" TIMESTAMP(3),
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_periods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "wms_task_tenant_id_wave_id_idx" ON "wms_task"("tenant_id", "wave_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "financial_periods_tenant_id_status_idx" ON "financial_periods"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "financial_periods_tenant_id_period_key" ON "financial_periods"("tenant_id", "period");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "outbox_events_tenant_id_idempotency_key_key" ON "outbox_events"("tenant_id", "idempotency_key");

-- AddForeignKey
ALTER TABLE "wms_task" ADD CONSTRAINT "wms_task_wave_id_fkey" FOREIGN KEY ("wave_id") REFERENCES "wms_wave"("id") ON DELETE CASCADE ON UPDATE CASCADE;
