const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

if (!schema.includes('model CostVariance')) {
    const varianceModel = `
// ==================== 52. Manufacturing Cost Variance ====================
model CostVariance {
  id              Int      @id @default(autoincrement())
  type            String   // PPV, MV, YV, LABOR
  orderId         Int      @map("order_id")
  expectedCost    Float    @map("expected_cost")
  actualCost      Float    @map("actual_cost")
  varianceAmount  Float    @map("variance_amount")
  isPosted        Boolean  @default(false) @map("is_posted")
  createdAt       DateTime @default(now()) @map("created_at")

  @@map("cost_variances")
}
`;
    schema += varianceModel;
    fs.writeFileSync('prisma/schema.prisma', schema);
    console.log('Added CostVariance model');
} else {
    console.log('CostVariance already exists');
}
