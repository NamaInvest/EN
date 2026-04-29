const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// 1. Inject opposite relation to Customer for Projects and PromissoryNotes
schema = schema.replace(
  '  deliveryNotes    DeliveryNote[]',
  '  deliveryNotes    DeliveryNote[]\n  projects         Project[]\n  promissoryNotes  PromissoryNote[]'
);

// 2. Inject opposite relation to Stock for WarehouseZones
schema = schema.replace(
  '  productStocks    ProductStock[]',
  '  productStocks    ProductStock[]\n  warehouseZones   WarehouseZone[]'
);

// 3. Inject opposite relation to BankAccount for LettersOfGuarantee
schema = schema.replace(
  '  lcs          LetterOfCredit[]',
  '  lcs          LetterOfCredit[]\n  lgs          LetterOfGuarantee[]'
);

// 4. Append the new Enterprise Tables
const newTables = `

// ==================== 61. Projects & Job Costing ====================
model Project {
  id          Int       @id @default(autoincrement())
  name        String
  description String?
  customerId  Int?      @map("customer_id")
  budget      Float     @default(0)
  startDate   DateTime? @map("start_date")
  endDate     DateTime? @map("end_date")
  status      String    @default("ACTIVE")
  createdAt   DateTime  @default(now()) @map("created_at")

  customer      Customer?       @relation(fields: [customerId], references: [id])
  tasks         ProjectTask[]

  @@map("projects")
}

model ProjectTask {
  id          Int       @id @default(autoincrement())
  projectId   Int       @map("project_id")
  name        String
  description String?
  cost        Float     @default(0)
  status      String    @default("PENDING")
  
  project     Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  @@map("project_tasks")
}

// ==================== 62. Advanced WMS ====================
model WarehouseZone {
  id          Int       @id @default(autoincrement())
  stockId     Int       @map("stock_id")
  name        String
  description String?

  stock       Stock     @relation(fields: [stockId], references: [id])
  racks       WarehouseRack[]

  @@map("warehouse_zones")
}

model WarehouseRack {
  id          Int       @id @default(autoincrement())
  zoneId      Int       @map("zone_id")
  name        String
  
  zone        WarehouseZone   @relation(fields: [zoneId], references: [id], onDelete: Cascade)
  bins        WarehouseBin[]

  @@map("warehouse_racks")
}

model WarehouseBin {
  id          Int       @id @default(autoincrement())
  rackId      Int       @map("rack_id")
  name        String
  barcode     String?
  maxWeight   Float     @default(0) @map("max_weight")
  
  rack        WarehouseRack   @relation(fields: [rackId], references: [id], onDelete: Cascade)

  @@map("warehouse_bins")
}

// ==================== 63. Credit Control & Legal ====================
model PromissoryNote {
  id          Int       @id @default(autoincrement())
  noteNumber  String    @unique @map("note_number")
  customerId  Int       @map("customer_id")
  amount      Float
  dueDate     DateTime  @map("due_date")
  status      String    @default("PENDING")
  notes       String?
  createdAt   DateTime  @default(now()) @map("created_at")

  customer    Customer  @relation(fields: [customerId], references: [id])

  @@map("promissory_notes")
}

model LetterOfGuarantee {
  id          Int       @id @default(autoincrement())
  lgNumber    String    @unique @map("lg_number")
  bankId      Int       @map("bank_id")
  customerId  Int?      @map("customer_id")
  type        String    
  amount      Float
  issueDate   DateTime  @map("issue_date")
  expiryDate  DateTime  @map("expiry_date")
  status      String    @default("ACTIVE")
  notes       String?

  bank        BankAccount   @relation(fields: [bankId], references: [id])

  @@map("letters_of_guarantee")
}
`;

// Append only if not already appended
if (!schema.includes("Projects & Job Costing")) {
  fs.writeFileSync('prisma/schema.prisma', schema + newTables);
  console.log('Successfully injected schemas!');
} else {
  console.log('Schemas already injected!');
}
