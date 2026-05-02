with open('prisma/schema.prisma', 'r', encoding='utf-8') as f:
    content = f.read()

# remove everything after the first occurrence of // Phase C.1
if '// Phase C.1' in content:
    content = content[:content.index('// Phase C.1')]

new_models = """
// Phase C.1: Standard Costing & Variance
model StandardCostVersion {
  id              Int      @id @default(autoincrement())
  productId       Int      @map("product_id")
  effectiveFrom   DateTime @map("effective_from")
  materialCost    Float    @map("material_cost")
  laborCost       Float    @map("labor_cost")
  overheadCost    Float    @map("overhead_cost")
  totalStdCost    Float    @map("total_std_cost")
  isActive        Boolean  @default(true) @map("is_active")

  product         Product  @relation(fields: [productId], references: [id])

  @@map("standard_cost_versions")
}

model VarianceTransaction {
  id                    Int      @id @default(autoincrement())
  type                  String   // PURCHASE_PRICE, MATERIAL_USAGE, LABOR_RATE, OVERHEAD_VOLUME
  productId             Int      @map("product_id")
  manufacturingOrderId  Int?     @map("manufacturing_order_id")
  amount                Float
  debit                 Float
  credit                Float
  postedAt              DateTime @default(now()) @map("posted_at")

  product               Product  @relation(fields: [productId], references: [id])
  mo                    ManufacturingOrder? @relation(fields: [manufacturingOrderId], references: [id])

  @@map("variance_transactions")
}
"""

with open('prisma/schema.prisma', 'w', encoding='utf-8') as f:
    f.write(content + new_models)
