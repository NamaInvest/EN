const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

// 1. Add qrToken and waiterCalls to RestaurantTable
const targetTable = `  capacity Int                 @default(4)
  status   String              @default("Available") // Available, Occupied, Reserved
  zone     RestaurantZone      @relation(fields: [zoneId], references: [id])
  sessions RestaurantSession[]`;

const replacementTable = `  capacity Int                 @default(4)
  status   String              @default("Available") // Available, Occupied, Reserved
  qrToken  String?             @unique @map("qr_token")
  zone     RestaurantZone      @relation(fields: [zoneId], references: [id])
  sessions RestaurantSession[]
  waiterCalls WaiterCall[]`;

content = content.replace(targetTable, replacementTable);

// 2. Append WaiterCall model at the end
const waiterCallModel = `
model WaiterCall {
  id         Int             @id @default(autoincrement())
  tenantId   String          @default("default") @map("tenant_id")
  tableId    Int             @map("table_id")
  status     String          @default("PENDING") // PENDING, RESPONDED
  createdAt  DateTime        @default(now()) @map("created_at")
  resolvedAt DateTime?       @map("resolved_at")

  table      RestaurantTable @relation(fields: [tableId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@index([tableId])
  @@map("restaurant_waiter_calls")
}
`;

content += waiterCallModel;

fs.writeFileSync('prisma/schema.prisma', content);
