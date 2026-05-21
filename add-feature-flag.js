const fs = require('fs');

const model = `
model FeatureFlag {
  id Int @id @default(autoincrement())
  key String @unique
  description String?
  enabled Boolean @default(false)
  percentage Int @default(0) // 0-100% rollout
  targetTenants Json? // List of tenant IDs
  targetUsers Json? // List of user IDs
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`;

const schemaPath = 'prisma/schema.prisma';
let content = fs.readFileSync(schemaPath, 'utf8');
if (!content.includes('model FeatureFlag')) {
  fs.writeFileSync(schemaPath, content + '\n' + model);
  console.log('Added FeatureFlag to schema');
} else {
  console.log('FeatureFlag already exists');
}
