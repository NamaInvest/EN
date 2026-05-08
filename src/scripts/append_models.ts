import * as fs from 'fs';

const models = `
model FieldAuditTrail {
  id           String   @id @default(cuid())
  tenantId     String   @map("tenant_id")
  tableName    String   @map("table_name")
  recordId     String   @map("record_id")
  fieldName    String   @map("field_name")
  oldValue     String?  @map("old_value") @db.Text
  newValue     String?  @map("new_value") @db.Text
  changedBy    String   @map("changed_by")
  changedAt    DateTime @default(now()) @map("changed_at")

  @@map("field_audit_trails")
}

model FieldAuditLog {
  id           String   @id @default(cuid())
  tenantId     String   @map("tenant_id")
  userId       String?  @map("user_id")
  tableName    String   @map("table_name")
  recordId     String   @map("record_id")
  action       String
  diff         Json?
  ipAddress    String?  @map("ip_address")
  userAgent    String?  @map("user_agent")
  createdAt    DateTime @default(now()) @map("created_at")

  @@map("field_audit_logs")
}
`;

fs.appendFileSync('prisma/schema.prisma', models);
console.log('Appended models.');
