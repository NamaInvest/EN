with open('prisma/schema.prisma', 'r', encoding='utf-8') as f:
    content = f.read()

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

// Phase C.2: Product Variants
model AttributeGroup {
  id        Int      @id @default(autoincrement())
  name      String   @unique // e.g. "Size", "Color"
  values    String   // JSON array of strings: ["S", "M", "L"], ["Red", "Blue"]
  createdAt DateTime @default(now()) @map("created_at")

  @@map("attribute_groups")
}

model ProductVariant {
  id              Int      @id @default(autoincrement())
  parentProductId Int      @map("parent_product_id")
  sku             String   @unique
  attributes      String   // JSON object e.g. {"Size": "M", "Color": "Red"}
  barcode         String?  @unique
  price           Float?
  cost            Float?
  isActive        Boolean  @default(true) @map("is_active")

  parentProduct   Product  @relation(fields: [parentProductId], references: [id])

  @@map("product_variants")
}
"""

with open('prisma/schema.prisma', 'a', encoding='utf-8') as f:
    f.write(new_models)
