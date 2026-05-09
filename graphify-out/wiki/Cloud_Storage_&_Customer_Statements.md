# Cloud Storage & Customer Statements

> 19 nodes · cohesion 0.16

## Key Concepts

- **cloud-storage.ts** (9 connections) — `cloud-storage.ts`
- **customer-statement-scheduler.ts** (8 connections) — `customer-statement-scheduler.ts`
- **uploadFile()** (5 connections) — `cloud-storage.ts`
- **CustomerStatementPdfEngine** (4 connections) — `customer-statement-pdf.ts`
- **customer-statement-email.ts** (3 connections) — `customer-statement-email.ts`
- **customer-statement-pdf.ts** (3 connections) — `customer-statement-pdf.ts`
- **deleteFile()** (3 connections) — `cloud-storage.ts`
- **uploadToS3()** (3 connections) — `cloud-storage.ts`
- **CustomerStatementEmailEngine** (3 connections) — `customer-statement-email.ts`
- **.generatePdf()** (3 connections) — `customer-statement-pdf.ts`
- **deleteFromLocal()** (2 connections) — `cloud-storage.ts`
- **deleteFromS3()** (2 connections) — `cloud-storage.ts`
- **getSignatureKey()** (2 connections) — `cloud-storage.ts`
- **uploadToLocal()** (2 connections) — `cloud-storage.ts`
- **.compileHtml()** (2 connections) — `customer-statement-pdf.ts`
- **CustomerStatementScheduler** (2 connections) — `customer-statement-scheduler.ts`
- **.runScheduledBatch()** (2 connections) — `customer-statement-scheduler.ts`
- **getFileUrl()** (1 connections) — `cloud-storage.ts`
- **.sendEmail()** (1 connections) — `customer-statement-email.ts`

## Relationships

- No strong cross-community connections detected

## Source Files

- `cloud-storage.ts`
- `customer-statement-email.ts`
- `customer-statement-pdf.ts`
- `customer-statement-scheduler.ts`

## Audit Trail

- EXTRACTED: 58 (97%)
- INFERRED: 2 (3%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*