const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Add to Customer
schema = schema.replace(/model Customer {/, 'model Customer {\n  isIntercompany Boolean @default(false) @map("is_intercompany")');
// Add to Vendor
schema = schema.replace(/model Vendor {/, 'model Vendor {\n  isIntercompany Boolean @default(false) @map("is_intercompany")');

fs.writeFileSync('prisma/schema.prisma', schema, 'utf8');
