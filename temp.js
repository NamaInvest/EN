const fs = require('fs');
const content = `
model MachineEvent {
  id              Int      @id @default(autoincrement())
  machineId       Int      @map("machine_id")
  status          String   // RUNNING, IDLE, DOWN
  timestamp       DateTime @default(now())
  durationMinutes Float    @default(0) @map("duration_minutes")
  reason          String?
  machine         Machine  @relation(fields: [machineId], references: [id], name: "MachineEventsRelation")

  @@map("machine_events")
}
`;
fs.appendFileSync('prisma/schema.prisma', content, 'utf8');

// Now we need to add the relation back to Machine model
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
schema = schema.replace('maintenanceLogs MachineMaintenance[]', 'maintenanceLogs MachineMaintenance[]\n  machineEvents   MachineEvent[] @relation("MachineEventsRelation")');
fs.writeFileSync('prisma/schema.prisma', schema, 'utf8');
