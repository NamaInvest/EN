-- CreateTable
CREATE TABLE "sales_quotations" (
    "id" SERIAL NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT 'default',
    "quotation_no" TEXT NOT NULL,
    "customer_id" INTEGER,
    "contact_name" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "quotation_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_until" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "subtotal" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "discountTotal" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "taxTotal" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "total" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "terms" TEXT,
    "notes" TEXT,
    "created_by_id" INTEGER,
    "accepted_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "converted_at" TIMESTAMP(3),
    "converted_invoice_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_quotation_lines" (
    "id" SERIAL NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT 'default',
    "quotation_id" INTEGER NOT NULL,
    "product_id" INTEGER,
    "description" TEXT,
    "quantity" DECIMAL(20,4) NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "discount_rate" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "tax_rate" DECIMAL(20,4) NOT NULL DEFAULT 15,
    "tax_amount" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "line_total" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sales_quotation_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sales_quotations_converted_invoice_id_key" ON "sales_quotations"("converted_invoice_id");

-- CreateIndex
CREATE INDEX "sales_quotations_tenant_id_idx" ON "sales_quotations"("tenant_id");

-- CreateIndex
CREATE INDEX "sales_quotations_customer_id_idx" ON "sales_quotations"("customer_id");

-- CreateIndex
CREATE INDEX "sales_quotations_status_idx" ON "sales_quotations"("status");

-- CreateIndex
CREATE INDEX "sales_quotations_quotation_date_idx" ON "sales_quotations"("quotation_date");

-- CreateIndex
CREATE INDEX "sales_quotations_valid_until_idx" ON "sales_quotations"("valid_until");

-- CreateIndex
CREATE INDEX "sales_quotations_converted_invoice_id_idx" ON "sales_quotations"("converted_invoice_id");

-- CreateIndex
CREATE UNIQUE INDEX "sales_quotations_tenant_id_quotation_no_key" ON "sales_quotations"("tenant_id", "quotation_no");

-- CreateIndex
CREATE UNIQUE INDEX "sales_quotation_lines_quotation_id_sort_order_key" ON "sales_quotation_lines"("quotation_id", "sort_order");

-- AddForeignKey
ALTER TABLE "sales_quotations" ADD CONSTRAINT "sales_quotations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_quotations" ADD CONSTRAINT "sales_quotations_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_quotations" ADD CONSTRAINT "sales_quotations_converted_invoice_id_fkey" FOREIGN KEY ("converted_invoice_id") REFERENCES "sales_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_quotation_lines" ADD CONSTRAINT "sales_quotation_lines_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "sales_quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_quotation_lines" ADD CONSTRAINT "sales_quotation_lines_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
