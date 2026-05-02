with open('prisma/schema.prisma', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix PaymentRunLine
content = content.replace(
    'vendor         Vendor            @relation(fields: [vendorId], references: [id])',
    'supplier       Customer          @relation(fields: [supplierId], references: [id])'
).replace(
    'vendorId       Int               @map("vendor_id")',
    'supplierId     Int               @map("supplier_id")'
)

# Fix WHTTransaction
content = content.replace(
    'vendor            Vendor   @relation(fields: [vendorId], references: [id])',
    'supplier          Customer @relation(fields: [supplierId], references: [id])'
)

with open('prisma/schema.prisma', 'w', encoding='utf-8') as f:
    f.write(content)
