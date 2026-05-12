const fs = require('fs');
const models = `
// ── Restaurant POS Models ──────────────────────────────────────────────

model RestaurantSection {
  id          String   @id @default(cuid())
  tenantId    String
  nameAr      String
  nameEn      String?
  isActive    Boolean  @default(true)
  tables      RestaurantTable[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([tenantId])
}

model RestaurantTable {
  id          String   @id @default(cuid())
  tenantId    String
  sectionId   String
  section     RestaurantSection @relation(fields: [sectionId], references: [id], onDelete: Cascade)
  tableNumber String
  capacity    Int      @default(4)
  qrToken     String   @unique
  status      String   @default("AVAILABLE") // AVAILABLE, OCCUPIED, RESERVED
  waiterCalls WaiterCall[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([tenantId])
  @@index([sectionId])
  @@unique([tenantId, tableNumber])
}

model WaiterCall {
  id          String   @id @default(cuid())
  tenantId    String
  tableId     String
  table       RestaurantTable @relation(fields: [tableId], references: [id], onDelete: Cascade)
  status      String   @default("PENDING") // PENDING, RESOLVED
  resolvedAt  DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([tenantId])
  @@index([tableId])
  @@index([tenantId, status])
}
`;
fs.appendFileSync('prisma/schema.prisma', models);
