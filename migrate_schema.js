const fs = require('fs');
const path = require('path');

const schemaPath = path.join('d:/namasoft9-3-main', 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// The new models to append
const newModels = `

// ==================== 13.1 Purchase Requisitions ====================
model PurchaseRequisition {
  id          Int      @id @default(autoincrement())
  reqNo       Int      @map("req_no")
  date        DateTime @default(now())
  department  String?
  status      String   @default("pending") // pending, approved, rejected
  requestedBy Int?     @map("requested_by")
  approvedBy  Int?     @map("approved_by")
  notes       String?

  requester   User?    @relation("PRRequester", fields: [requestedBy], references: [id])
  approver    User?    @relation("PRApprover", fields: [approvedBy], references: [id])
  
  details     PurchaseRequisitionDetail[]

  @@map("purchase_requisitions")
}

model PurchaseRequisitionDetail {
  id          Int      @id @default(autoincrement())
  reqId       Int      @map("req_id")
  productId   Int      @map("product_id")
  productName String?  @map("product_name")
  quantity    Float    @default(1)
  notes       String?

  requisition PurchaseRequisition @relation(fields: [reqId], references: [id], onDelete: Cascade)
  product     Product             @relation(fields: [productId], references: [id])

  @@map("purchase_requisition_details")
}

// ==================== 13.2 Request For Quotations ====================
model RequestForQuotation {
  id          Int      @id @default(autoincrement())
  rfqNo       Int      @map("rfq_no")
  date        DateTime @default(now())
  dueDate     DateTime? @map("due_date")
  supplierId  Int?     @map("supplier_id")
  status      String   @default("draft") // draft, sent, received, closed
  userId      Int?     @map("user_id")
  notes       String?

  supplier    Customer? @relation(fields: [supplierId], references: [id])
  user        User?     @relation(fields: [userId], references: [id])

  details     RequestForQuotationDetail[]

  @@map("request_for_quotations")
}

model RequestForQuotationDetail {
  id          Int      @id @default(autoincrement())
  rfqId       Int      @map("rfq_id")
  productId   Int      @map("product_id")
  productName String?  @map("product_name")
  quantity    Float    @default(1)
  targetPrice Float?   @map("target_price")

  rfq         RequestForQuotation @relation(fields: [rfqId], references: [id], onDelete: Cascade)
  product     Product             @relation(fields: [productId], references: [id])

  @@map("request_for_quotation_details")
}

// ==================== 13.3 Goods Receipt Notes ====================
model GoodsReceiptNote {
  id          Int      @id @default(autoincrement())
  grnNo       Int      @map("grn_no")
  date        DateTime @default(now())
  supplierId  Int?     @map("supplier_id")
  orderId     Int?     @map("order_id")
  stockId     Int      @default(1) @map("stock_id")
  status      String   @default("received") // received, partial, inspected
  receivedBy  Int?     @map("received_by")
  notes       String?

  supplier    Customer? @relation(fields: [supplierId], references: [id])
  order       PurchaseOrder? @relation(fields: [orderId], references: [id])
  stock       Stock?    @relation(fields: [stockId], references: [id])
  receiver    User?     @relation(fields: [receivedBy], references: [id])

  details     GoodsReceiptNoteDetail[]

  @@map("goods_receipt_notes")
}

model GoodsReceiptNoteDetail {
  id          Int      @id @default(autoincrement())
  grnId       Int      @map("grn_id")
  productId   Int      @map("product_id")
  productName String?  @map("product_name")
  quantity    Float    @default(1)
  acceptedQty Float    @default(1) @map("accepted_qty")
  rejectedQty Float    @default(0) @map("rejected_qty")

  grn         GoodsReceiptNote @relation(fields: [grnId], references: [id], onDelete: Cascade)
  product     Product          @relation(fields: [productId], references: [id])

  @@map("goods_receipt_note_details")
}
`;

if (!schema.includes('model PurchaseRequisition')) {
    // 1. Add back-relations to User
    schema = schema.replace(/auditLogs\s+AuditLog\[\]/, 'auditLogs AuditLog[]\n  prRequisitions PurchaseRequisition[] @relation("PRRequester")\n  prApprovals PurchaseRequisition[] @relation("PRApprover")\n  rfqs RequestForQuotation[]\n  goodsReceipts GoodsReceiptNote[]');
    
    // 2. Add back-relations to Customer
    schema = schema.replace(/purchaseReturns\s+PurchaseReturn\[\]/, 'purchaseReturns PurchaseReturn[]\n  rfqs RequestForQuotation[]\n  goodsReceipts GoodsReceiptNote[]');

    // 3. Add back-relations to Product
    schema = schema.replace(/stockMovements\s+StockMovement\[\]/, 'stockMovements StockMovement[]\n  prDetails PurchaseRequisitionDetail[]\n  rfqDetails RequestForQuotationDetail[]\n  grnDetails GoodsReceiptNoteDetail[]');

    // 4. Add back-relations to PurchaseOrder
    schema = schema.replace(/landedCosts\s+LandedCost\[\]/, 'landedCosts LandedCost[]\n  goodsReceipts GoodsReceiptNote[]');

    // 5. Add back-relations to Stock
    schema = schema.replace(/stockMovements\s+StockMovement\[\]/, 'stockMovements StockMovement[]\n  goodsReceipts GoodsReceiptNote[]');

    // Append the massive block
    schema += newModels;

    fs.writeFileSync(schemaPath, schema);
    console.log('Schema updated successfully with PR, RFQ, and GRN models!');
} else {
    console.log('Models already exist.');
}
