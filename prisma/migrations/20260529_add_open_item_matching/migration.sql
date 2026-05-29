-- CreateTable
CREATE TABLE "open_item_matchings" (
    "id" SERIAL NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT 'default',
    "sales_invoice_id" INTEGER,
    "purchase_return_id" INTEGER,
    "purchase_invoice_id" INTEGER,
    "sales_return_id" INTEGER,
    "treasury_id" INTEGER,
    "amount" DECIMAL(20,4) NOT NULL,
    "allocated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "allocated_by" TEXT NOT NULL,
    "source_type" TEXT NOT NULL DEFAULT 'MANUAL',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "reversed_at" TIMESTAMP(3),
    "reversed_by" TEXT,
    "reversal_reason" TEXT,
    "notes" TEXT,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,

    CONSTRAINT "open_item_matchings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "open_item_matchings_tenant_id_sales_invoice_id_deleted_at_idx" ON "open_item_matchings"("tenant_id", "sales_invoice_id", "deleted_at");

-- CreateIndex
CREATE INDEX "open_item_matchings_tenant_id_purchase_invoice_id_deleted_a_idx" ON "open_item_matchings"("tenant_id", "purchase_invoice_id", "deleted_at");

-- CreateIndex
CREATE INDEX "open_item_matchings_tenant_id_treasury_id_deleted_at_idx" ON "open_item_matchings"("tenant_id", "treasury_id", "deleted_at");

-- CreateIndex
CREATE INDEX "open_item_matchings_tenant_id_sales_return_id_deleted_at_idx" ON "open_item_matchings"("tenant_id", "sales_return_id", "deleted_at");

-- CreateIndex
CREATE INDEX "open_item_matchings_tenant_id_purchase_return_id_deleted_at_idx" ON "open_item_matchings"("tenant_id", "purchase_return_id", "deleted_at");

-- AddForeignKey
ALTER TABLE "open_item_matchings" ADD CONSTRAINT "open_item_matchings_sales_invoice_id_fkey" FOREIGN KEY ("sales_invoice_id") REFERENCES "sales_invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "open_item_matchings" ADD CONSTRAINT "open_item_matchings_purchase_return_id_fkey" FOREIGN KEY ("purchase_return_id") REFERENCES "purchase_returns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "open_item_matchings" ADD CONSTRAINT "open_item_matchings_purchase_invoice_id_fkey" FOREIGN KEY ("purchase_invoice_id") REFERENCES "purchase_invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "open_item_matchings" ADD CONSTRAINT "open_item_matchings_sales_return_id_fkey" FOREIGN KEY ("sales_return_id") REFERENCES "sales_returns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "open_item_matchings" ADD CONSTRAINT "open_item_matchings_treasury_id_fkey" FOREIGN KEY ("treasury_id") REFERENCES "treasury"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
