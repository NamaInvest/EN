const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Remove failed patch models if they exist (they might from the previous attempt)
if (schema.includes('model WHTRule')) {
    console.log('Already patched, modifying Customer relation if needed');
    if (!schema.includes('whtTransactions WHTTransaction[]')) {
        schema = schema.replace(
            `  expenses          Expense[]`,
            `  expenses          Expense[]\n  whtTransactions   WHTTransaction[]`
        );
        schema = schema.replace(
            `  payments        Treasury[]        @relation("PurchaseInvoicePayments")`,
            `  payments        Treasury[]        @relation("PurchaseInvoicePayments")\n  whtTransactions WHTTransaction[]`
        );
        fs.writeFileSync('prisma/schema.prisma', schema);
    }
    process.exit(0);
}

const whtModels = `
// ==================== 51. Withholding Tax (WHT) ====================

model WHTRule {
  id              Int      @id @default(autoincrement())
  countryCode     String   @map("country_code")
  serviceType     String   @map("service_type")
  residentRate    Float    @map("resident_rate")
  nonResidentRate Float    @map("non_resident_rate")
  effectiveFrom   DateTime @map("effective_from")
  treatyOverrides String?  @map("treaty_overrides") // JSON string
  isActive        Boolean  @default(true) @map("is_active")

  transactions    WHTTransaction[]

  @@map("fng_wht_rules")
}

model WHTTransaction {
  id                Int      @id @default(autoincrement())
  vendorId          Int      @map("vendor_id")
  invoiceId         Int?     @map("invoice_id")
  ruleId            Int      @map("rule_id")
  baseAmount        Float    @map("base_amount")
  whtRate           Float    @map("wht_rate")
  whtAmount         Float    @map("wht_amount")
  certificateNumber String?  @map("certificate_number")
  paidToZATCA       Boolean  @default(false) @map("paid_to_zatca")
  createdAt         DateTime @default(now()) @map("created_at")

  rule              WHTRule  @relation(fields: [ruleId], references: [id])
  vendor            Customer @relation(fields: [vendorId], references: [id])
  invoice           PurchaseInvoice? @relation(fields: [invoiceId], references: [id])

  @@map("fng_wht_transactions")
}
`;

schema += whtModels;

// Add to Customer (since Vendor = Customer)
schema = schema.replace(
    `  expenses          Expense[]`,
    `  expenses          Expense[]\n  whtTransactions   WHTTransaction[]`
);

// Add to PurchaseInvoice
schema = schema.replace(
    `  payments        Treasury[]        @relation("PurchaseInvoicePayments")`,
    `  payments        Treasury[]        @relation("PurchaseInvoicePayments")\n  whtTransactions WHTTransaction[]`
);

fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Added WHT models and relations (Fixed Customer)');
