with open('prisma/schema.prisma', 'r', encoding='utf-8') as f:
    content = f.read()

# remove everything after the first occurrence of // Phase B.2
if '// Phase B.2' in content:
    content = content[:content.index('// Phase B.2')]

if '// Phase B.3' in content:
    content = content[:content.index('// Phase B.3')]

# clean up duplicate WHT
if 'model WHTRule' in content:
    content = content[:content.rindex('model WHTRule')]

new_models = """
// Phase B.2: Payment Runs (SAP F110 Equivalent)
model PaymentRun {
  id             Int               @id @default(autoincrement())
  runDate        DateTime          @map("run_date")
  paymentMethod  String            @map("payment_method") // CHECK, TRANSFER, WIRE
  bankAccountId  Int               @map("bank_account_id")
  status         String            @default("DRAFT")      // DRAFT, PROPOSED, EXECUTED
  totalAmount    Float             @default(0) @map("total_amount")
  createdAt      DateTime          @default(now()) @map("created_at")

  lines          PaymentRunLine[]

  @@map("payment_runs")
}

model PaymentRunLine {
  id             Int               @id @default(autoincrement())
  runId          Int               @map("run_id")
  supplierId     Int               @map("supplier_id")
  invoiceIds     String            @map("invoice_ids") // JSON string
  amount         Float
  status         String            @default("PENDING") // PENDING, PAID, FAILED

  run            PaymentRun        @relation(fields: [runId], references: [id], onDelete: Cascade)
  supplier       Customer          @relation(fields: [supplierId], references: [id])

  @@map("payment_run_lines")
}

// Phase B.3: Withholding Tax (WHT)
model WHTRule {
  id               Int      @id @default(autoincrement())
  countryCode      String   @map("country_code")
  serviceType      String   @map("service_type")
  residentRate     Float    @map("resident_rate")
  nonResidentRate  Float    @map("non_resident_rate")
  effectiveFrom    DateTime @map("effective_from")
  treatyOverrides  String?  @map("treaty_overrides")

  @@map("wht_rules")
}

model WHTTransaction {
  id                Int      @id @default(autoincrement())
  supplierId        Int      @map("supplier_id")
  invoiceId         Int      @map("invoice_id")
  baseAmount        Float    @map("base_amount")
  whtRate           Float    @map("wht_rate")
  whtAmount         Float    @map("wht_amount")
  certificateNumber String?  @map("certificate_number")
  paidToZATCA       Boolean  @default(false) @map("paid_to_zatca")
  createdAt         DateTime @default(now()) @map("created_at")

  supplier          Customer        @relation(fields: [supplierId], references: [id])
  invoice           PurchaseInvoice @relation(fields: [invoiceId], references: [id])

  @@map("wht_transactions")
}
"""

with open('prisma/schema.prisma', 'w', encoding='utf-8') as f:
    f.write(content + new_models)
