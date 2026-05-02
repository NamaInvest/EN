with open('prisma/schema.prisma', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove everything after Phase C.3 Subcontracting
if '// Phase C.3' in content:
    content = content[:content.index('// Phase C.3')]

new_models = """
// Phase C.3: Subcontracting
model SubcontractingPO {
  id                Int       @id @default(autoincrement())
  supplierId        Int       @map("supplier_id")
  productToReceive  Int       @map("product_to_receive")
  productsToSend    String    @map("products_to_send") // JSON array
  expectedDate      DateTime  @map("expected_date")
  status            String    @default("DRAFT") // DRAFT, ISSUED, PARTIAL_RECEIPT, COMPLETED
  createdAt         DateTime  @default(now()) @map("created_at")

  supplier          Customer  @relation(fields: [supplierId], references: [id])
  product           Product   @relation(fields: [productToReceive], references: [id])
  movements         SubcontractMovement[]

  @@map("subcontracting_pos")
}

model SubcontractMovement {
  id                Int       @id @default(autoincrement())
  scPoId            Int       @map("sc_po_id")
  type              String    // ISSUE, RETURN, RECEIVE_FINISHED
  productId         Int       @map("product_id")
  qty               Float
  postedAt          DateTime  @default(now()) @map("posted_at")

  po                SubcontractingPO @relation(fields: [scPoId], references: [id])
  product           Product          @relation(fields: [productId], references: [id])

  @@map("subcontract_movements")
}

// Phase C.4: Quality Management (QM / CAPA / NCR)
model QualitySpec {
  id                Int       @id @default(autoincrement())
  productId         Int       @unique @map("product_id")
  parameters        String    // JSON e.g. {"moisture": {"min": 2, "max": 5}}
  createdAt         DateTime  @default(now()) @map("created_at")

  product           Product   @relation(fields: [productId], references: [id])

  @@map("quality_specs")
}

model NonConformanceReport {
  id                Int       @id @default(autoincrement())
  inspectionId      Int       @map("inspection_id")
  severity          String    // LOW, MEDIUM, HIGH, CRITICAL
  description       String
  dispositionType   String    @map("disposition_type") // USE_AS_IS, REWORK, RETURN_VENDOR, SCRAP
  costImpact        Float     @default(0) @map("cost_impact")
  createdAt         DateTime  @default(now()) @map("created_at")

  inspection        QualityInspection @relation(fields: [inspectionId], references: [id])
  capas             CorrectiveAction[]

  @@map("non_conformance_reports")
}

model CorrectiveAction {
  id                    Int       @id @default(autoincrement())
  ncrId                 Int       @map("ncr_id")
  rootCause             String    @map("root_cause")
  action                String
  owner                 String
  dueDate               DateTime  @map("due_date")
  status                String    @default("OPEN") // OPEN, IN_PROGRESS, CLOSED
  effectivenessReview   String?   @map("effectiveness_review")

  ncr                   NonConformanceReport @relation(fields: [ncrId], references: [id])

  @@map("corrective_actions")
}
"""

with open('prisma/schema.prisma', 'w', encoding='utf-8') as f:
    f.write(content + new_models)
