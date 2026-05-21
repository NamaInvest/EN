const fs = require('fs');

const model = `
model ChainState {
  id Int @id @default(autoincrement())
  tenantId String
  chainName String
  status String // PENDING, RUNNING, PAUSED, COMPLETED, FAILED
  actor String?
  payload Json?
  results Json?
  errors Json?
  audit Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`;

const schemaPath = 'prisma/schema.prisma';
let content = fs.readFileSync(schemaPath, 'utf8');
if (!content.includes('model ChainState')) {
  fs.writeFileSync(schemaPath, content + '\n' + model);
  console.log('Added ChainState to schema');
} else {
  console.log('ChainState already exists');
}
