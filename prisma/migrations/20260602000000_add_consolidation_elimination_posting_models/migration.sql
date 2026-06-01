-- CreateTable
CREATE TABLE "consolidation_elimination_requests" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "group_id" INTEGER NOT NULL,
    "period_from" TIMESTAMP(3) NOT NULL,
    "period_to" TIMESTAMP(3) NOT NULL,
    "period_key" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "preview_hash" TEXT NOT NULL,
    "snapshot_json" JSONB NOT NULL,
    "total_debit" DECIMAL(20,4) NOT NULL,
    "total_credit" DECIMAL(20,4) NOT NULL,
    "is_balanced" BOOLEAN NOT NULL DEFAULT true,
    "posting_reference" TEXT,
    "reversal_reference" TEXT,
    "auto_reverse_date" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "submitted_by" TEXT,
    "cfo_approved_by" TEXT,
    "master_approved_by" TEXT,
    "posted_by" TEXT,
    "reversed_by" TEXT,
    "rejected_by" TEXT,
    "rejection_reason" TEXT,
    "journal_entry_id" INTEGER,
    "reversal_journal_entry_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_at" TIMESTAMP(3),
    "cfo_approved_at" TIMESTAMP(3),
    "master_approved_at" TIMESTAMP(3),
    "posted_at" TIMESTAMP(3),
    "reversed_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consolidation_elimination_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consolidation_elimination_approvals" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "actor_role" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consolidation_elimination_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consolidation_elimination_snapshots" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consolidation_elimination_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consolidation_elimination_postings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "journal_entry_id" INTEGER NOT NULL,
    "reversal_entry_id" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "error_message" TEXT,
    "posted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consolidation_elimination_postings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "consolidation_elimination_requests_tenant_id_group_id_perio_idx" ON "consolidation_elimination_requests"("tenant_id", "group_id", "period_key");

-- CreateIndex
CREATE UNIQUE INDEX "consolidation_elimination_requests_tenant_id_group_id_perio_key" ON "consolidation_elimination_requests"("tenant_id", "group_id", "period_key", "posting_reference");

-- CreateIndex
CREATE INDEX "consolidation_elimination_approvals_tenant_id_request_id_idx" ON "consolidation_elimination_approvals"("tenant_id", "request_id");

-- CreateIndex
CREATE UNIQUE INDEX "consolidation_elimination_snapshots_request_id_key" ON "consolidation_elimination_snapshots"("request_id");

-- CreateIndex
CREATE INDEX "consolidation_elimination_postings_tenant_id_request_id_idx" ON "consolidation_elimination_postings"("tenant_id", "request_id");

-- AddForeignKey
ALTER TABLE "consolidation_elimination_requests" ADD CONSTRAINT "consolidation_elimination_requests_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "consolidation_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consolidation_elimination_approvals" ADD CONSTRAINT "consolidation_elimination_approvals_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "consolidation_elimination_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consolidation_elimination_postings" ADD CONSTRAINT "consolidation_elimination_postings_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "consolidation_elimination_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
