const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

const newModels = `
// ==================== 50. Consolidation & IFRS (Enterprise) ====================

model ConsolidationRun {
  id             Int      @id @default(autoincrement())
  holdingId      Int      @map("holding_id")
  fiscalPeriodId Int      @map("fiscal_period_id")
  userId         Int      @map("user_id")
  status         String   @default("DRAFT") // DRAFT, COMMITTED
  totalAssets    Float    @default(0) @map("total_assets")
  totalLiabilities Float  @default(0) @map("total_liabilities")
  totalEquity    Float    @default(0) @map("total_equity")
  createdAt      DateTime @default(now()) @map("created_at")

  lines          ConsolidationLine[]

  @@map("fng_consolidation_runs")
}

model ConsolidationLine {
  id              Int      @id @default(autoincrement())
  runId           Int      @map("run_id")
  type            String   // ELIMINATION, TRANSLATION, NCI
  accountId       Int      @map("account_id")
  debit           Float    @default(0)
  credit          Float    @default(0)
  sourceCompanyId Int?     @map("source_company_id")
  targetCompanyId Int?     @map("target_company_id")
  description     String?

  run             ConsolidationRun @relation(fields: [runId], references: [id], onDelete: Cascade)
  account         Account          @relation(fields: [accountId], references: [id])

  @@map("fng_consolidation_lines")
}

model AllocationRule {
  id              Int      @id @default(autoincrement())
  name            String
  sourceAccountId Int      @map("source_account_id")
  sourceCostCenterId Int?  @map("source_cost_center_id")
  basis           String   // FIXED_PCT, HEADCOUNT, REVENUE
  isActive        Boolean  @default(true) @map("is_active")

  targets         AllocationTarget[]
  runs            AllocationRun[]

  @@map("fng_allocation_rules")
}

model AllocationTarget {
  id              Int      @id @default(autoincrement())
  ruleId          Int      @map("rule_id")
  targetCostCenterId Int   @map("target_cost_center_id")
  targetAccountId Int?     @map("target_account_id")
  percentage      Float

  rule            AllocationRule @relation(fields: [ruleId], references: [id], onDelete: Cascade)

  @@map("fng_allocation_targets")
}

model AllocationRun {
  id              Int      @id @default(autoincrement())
  ruleId          Int      @map("rule_id")
  fiscalPeriodId  Int      @map("fiscal_period_id")
  status          String   @default("COMPLETED")
  runAt           DateTime @default(now()) @map("run_at")
  journalEntryId  Int?     @map("journal_entry_id")

  rule            AllocationRule @relation(fields: [ruleId], references: [id])

  @@map("fng_allocation_runs")
}

model FXRevaluationRun {
  id              Int      @id @default(autoincrement())
  date            DateTime
  baseCurrency    String   @map("base_currency")
  status          String   @default("COMMITTED")
  journalEntryId  Int?     @map("journal_entry_id")
  createdAt       DateTime @default(now()) @map("created_at")

  @@map("fng_fx_reval_runs")
}
`;

if (!schema.includes('model ConsolidationRun')) {
    schema += newModels;
    
    // Add parentId and ownershipPct to Company
    schema = schema.replace(
        `  commercialRecord String?  @map("commercial_record")`,
        `  commercialRecord String?  @map("commercial_record")\n  parentId         Int?     @map("parent_id")\n  ownershipPct     Float    @default(100) @map("ownership_pct")`
    );

    fs.writeFileSync('prisma/schema.prisma', schema);
    console.log('Appended Enterprise schema models');
} else {
    console.log('Models already exist');
}
