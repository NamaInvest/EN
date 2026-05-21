const fs = require('fs');

const models = `
// --- F3: User Stories & Agile Management ---

model Sprint {
  id Int @id @default(autoincrement())
  tenantId String @default("default")
  name String
  startDate DateTime
  endDate DateTime
  status String @default("PLANNING") // PLANNING, ACTIVE, COMPLETED
  velocity Int @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  stories SprintStory[]

  @@map("sprints")
}

model Story {
  id String @id // e.g. US-hr-12
  tenantId String @default("default")
  module String
  role String
  action String
  businessValue String
  acceptanceCriteria String @db.Text
  edgeCases String @db.Text
  points Int @default(1)
  status String @default("BACKLOG") // BACKLOG, IN_PROGRESS, REVIEW, DONE
  jiraTicketId String?

  apiEndpoint String?
  prismaModels String?
  uiRoute String?
  testFiles String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  sprints SprintStory[]

  @@map("stories")
}

model SprintStory {
  id Int @id @default(autoincrement())
  tenantId String @default("default")
  sprintId Int
  storyId String

  sprint Sprint @relation(fields: [sprintId], references: [id])
  story Story @relation(fields: [storyId], references: [id])

  @@unique([sprintId, storyId])
  @@map("sprint_stories")
}
`;

fs.appendFileSync('prisma/schema.prisma', models);
console.log('Appended successfully');
