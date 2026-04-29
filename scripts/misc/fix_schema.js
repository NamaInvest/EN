const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// 1. Remove the appended massive block at the bottom
const splitMarker = '// ==================== 13.1 Purchase Requisitions ====================';
if (schema.includes(splitMarker)) {
    schema = schema.split(splitMarker)[0];
}

// 2. Clean up the User model (remove the garbage injected earlier)
const badUserBlock = "  auditLogs AuditLog[]\\n  prRequisitions PurchaseRequisition[] @relation(\\"PRRequester\\")\\n  prApprovals PurchaseRequisition[] @relation(\\"PRApprover\\")\\n  rfqs RequestForQuotation[]\\n  goodsReceipts GoodsReceiptNote[]\\n  stockMovements StockMovement[]\\n  goodsReceipts GoodsReceiptNote[]\\n  prDetails PurchaseRequisitionDetail[]\\n  rfqDetails RequestForQuotationDetail[]\\n  grnDetails GoodsReceiptNoteDetail[]";
const badUserBlock2 = "  auditLogs AuditLog[]\\r\\n  prRequisitions PurchaseRequisition[] @relation(\\"PRRequester\\")\\r\\n  prApprovals PurchaseRequisition[] @relation(\\"PRApprover\\")\\r\\n  rfqs RequestForQuotation[]\\r\\n  goodsReceipts GoodsReceiptNote[]\\r\\n  stockMovements StockMovement[]\\r\\n  goodsReceipts GoodsReceiptNote[]\\r\\n  prDetails PurchaseRequisitionDetail[]\\r\\n  rfqDetails RequestForQuotationDetail[]\\r\\n  grnDetails GoodsReceiptNoteDetail[]";

schema = schema.replace(badUserBlock, '  auditLogs AuditLog[]\\n  stockMovements StockMovement[]');
schema = schema.replace(badUserBlock2, '  auditLogs AuditLog[]\\r\\n  stockMovements StockMovement[]');

// Save the pristine schema
fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Restored schema.prisma to pristine state.');

function injectIntoModel(modelName, stringToInject) {
    const mapTag = '  @@map';
    const splitKey = 'model ' + modelName + ' {';
    const parts = schema.split(splitKey);
    if (parts.length > 1) {
        const innerParts = parts[1].split(mapTag);
        if (innerParts.length > 1) {
            innerParts[0] = innerParts[0] + '  ' + stringToInject + '\\n\\n';
            parts[1] = innerParts.join(mapTag);
            schema = parts.join(splitKey);
        }
    }
}

injectIntoModel('User', 'prRequisitions PurchaseRequisition[] @relation("PRRequester")\\n  prApprovals PurchaseRequisition[] @relation("PRApprover")\\n  rfqs RequestForQuotation[]\\n  goodsReceipts GoodsReceiptNote[]');
injectIntoModel('Customer', 'rfqs RequestForQuotation[]\\n  goodsReceipts GoodsReceiptNote[]');
injectIntoModel('Product', 'prDetails PurchaseRequisitionDetail[]\\n  rfqDetails RequestForQuotationDetail[]\\n  grnDetails GoodsReceiptNoteDetail[]');
injectIntoModel('PurchaseOrder', 'goodsReceipts GoodsReceiptNote[]');
injectIntoModel('Stock', 'goodsReceipts GoodsReceiptNote[]');

// The new models to append
const newModels = \`
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
\`;

schema += newModels;

fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Successfully injected proper Prisma Sub-Module relations!');
