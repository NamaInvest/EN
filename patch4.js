const fs = require('fs');
let c = fs.readFileSync('prisma/schema.prisma', 'utf8');

c = c.replace(
    `  grn     GoodsReceiptNote @relation(fields: [grnId], references: [id], onDelete: Cascade)
  product Product          @relation(fields: [productId], references: [id])

  @@map("goods_receipt_note_details")`,
    `  grn     GoodsReceiptNote @relation(fields: [grnId], references: [id], onDelete: Cascade)
  product Product          @relation(fields: [productId], references: [id])
  batch   ProductBatch?    @relation(fields: [batchId], references: [id])
  batchId Int?             @map("batch_id")

  @@map("goods_receipt_note_details")`
);

c = c.replace(
    `  salesDetails   SalesInvoiceDetail[]
  stockMovements StockMovement[]`,
    `  salesDetails   SalesInvoiceDetail[]
  stockMovements StockMovement[]
  grnDetails     GoodsReceiptNoteDetail[]
  deliveryDetails DeliveryNoteDetail[]`
);

c = c.replace(
    `  delivery DeliveryNote @relation(fields: [deliveryId], references: [id], onDelete: Cascade)
  product  Product      @relation(fields: [productId], references: [id])

  @@map("delivery_note_details")`,
    `  delivery DeliveryNote @relation(fields: [deliveryId], references: [id], onDelete: Cascade)
  product  Product      @relation(fields: [productId], references: [id])
  batch    ProductBatch? @relation(fields: [batchId], references: [id])
  batchId  Int?          @map("batch_id")

  @@map("delivery_note_details")`
);

fs.writeFileSync('prisma/schema.prisma', c);
console.log('patched schema successfully');
