const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

content = content.replace(
  /sessions RestaurantSession\[\]/g,
  'sessions RestaurantSession[]\n  waiterCalls WaiterCall[]'
);

content = content.replace(
  /status   String              @default\("Available"\) \/\/ Available, Occupied, Reserved/g,
  'status   String              @default("Available") // Available, Occupied, Reserved\n  qrToken  String?             @unique @map("qr_token")'
);

fs.writeFileSync('prisma/schema.prisma', content);
