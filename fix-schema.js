const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

schema = schema.replace(/\\n/g, '\\n');

// For safety, let's just rewrite the bottom chunk directly
const idx = schema.indexOf('// --- V3 INDUSTRY VERTICALS SCHEMA ---');
if (idx !== -1) {
  schema = schema.substring(0, idx) + `// --- V3 INDUSTRY VERTICALS SCHEMA ---
model RetailPOSOrder {
  id Int @id @default(autoincrement())
  branchId Int?
  total Float
  status String
  createdAt DateTime @default(now())
}
model RestaurantKDSTicket {
  id Int @id @default(autoincrement())
  tableNo Int?
  status String
  items Json
  createdAt DateTime @default(now())
}
model ManufacturingBOM {
  id Int @id @default(autoincrement())
  productId Int
  components Json
  version String
  createdAt DateTime @default(now())
}
model ConstructionBOQ {
  id Int @id @default(autoincrement())
  projectId Int
  items Json
  totalCost Float
  createdAt DateTime @default(now())
}
model ClinicPatientRecord {
  id Int @id @default(autoincrement())
  patientName String
  icd10Codes Json?
  vitals Json?
  createdAt DateTime @default(now())
}
model SchoolStudent {
  id Int @id @default(autoincrement())
  name String
  grade String
  enrollmentDate DateTime @default(now())
}
model RealEstateLease {
  id Int @id @default(autoincrement())
  propertyId Int
  tenantId Int
  startDate DateTime
  endDate DateTime
  rentAmount Float
  status String
  createdAt DateTime @default(now())
}
model DistributionRoute {
  id Int @id @default(autoincrement())
  driverId Int
  stops Json
  status String
  createdAt DateTime @default(now())
}
model ServiceTimesheet {
  id Int @id @default(autoincrement())
  employeeId Int
  projectId Int
  hours Float
  date DateTime
  createdAt DateTime @default(now())
}
`;
  fs.writeFileSync('prisma/schema.prisma', schema);
}
console.log('Schema fixed successfully.');
