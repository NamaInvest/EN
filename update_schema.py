with open('prisma/schema.prisma', 'a', encoding='utf-8') as f:
    f.write("""

// Phase B.1: Expected Credit Loss (IFRS 9)
model ECLModel {
  id              Int      @id @default(autoincrement())
  customerSegment String   @map("customer_segment")
  stage1Pct       Float    @map("stage1_pct")
  stage2Pct       Float    @map("stage2_pct")
  stage3Pct       Float    @map("stage3_pct")
  lookbackMonths  Int      @default(12) @map("lookback_months")

  @@map("ecl_models")
}

model ECLAssessment {
  id                   Int      @id @default(autoincrement())
  customerId           Int      @map("customer_id")
  fiscalPeriodId       Int      @map("fiscal_period_id")
  exposure             Float
  stage                Int      // 1, 2, or 3
  probabilityOfDefault Float    @map("probability_of_default")
  lossGivenDefault     Float    @map("loss_given_default")
  eclAmount            Float    @map("ecl_amount")
  runAt                DateTime @default(now()) @map("run_at")

  customer             Customer @relation(fields: [customerId], references: [id])

  @@map("ecl_assessments")
}
""")
