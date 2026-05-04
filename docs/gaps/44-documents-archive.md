# النقص #44: Documents Archive + OCR + Expiry Tracking — مواصفات

> **المرجعيات:** SAP DMS、Documentum、SharePoint、Box、DocuWare、SAP Concur Imaging

---

## 1. البرومنت

```
وسّع Documents Management:

موجود: DocumentArchive, DocumentExpiryAlert, document-expiry, /api/documents

النواقص:
A) Centralized document repository
B) Multi-format support (PDF, images, Office, video)
C) Folder hierarchy + tagging
D) Version control
E) E-signature
F) OCR (PDF, images → searchable text)
G) AI auto-tagging + classification
H) Expiry tracking (with reminders)
I) Access control (per folder/document)
J) Audit trail
K) Search (full-text + metadata)
L) Sharing (internal + external links)
M) Retention policies (auto-delete after X)
N) Compliance archiving (immutable)

APIs (35+), UI (12 pages), Tests 50+
```

---

## 2. السيناريوهات (8)

### A — Document Upload + Auto-Tag
```
1. User uploads invoice PDF
2. System:
   - OCR extracts text
   - AI classifies: type=Vendor Invoice
   - Extracts: vendor name, amount, date
   - Auto-files to /Vendors/ABC/2026/Invoices
   - Creates expiry alert (none for invoices)
3. Searchable by content + metadata
```

### B — KYC Document Renewal
```
- Customer's CR expires in 30 days
- System alerts: customer + AR
- Email with renewal request
- New CR uploaded → AI verifies authenticity
- Old version archived
- Expiry tracking updated
```

### C — Contract E-Signature
```
- Contract uploaded
- Routing: 3 signatories
- DocuSign integration
- Each signs sequentially
- Final signed → immutable
- Distributed to all parties
```

### D — Folder Permissions
```
- /HR/Salaries folder
- Permission: HR + CFO only
- Subfolder: /HR/Salaries/Restricted
- Permission: CFO only
- Hierarchy + inheritance
```

### E — Retention Policy
```
- Tax documents: keep 10 years
- Contracts: keep until 7 years after end
- HR personal: keep 7 years after termination
- Auto-purge after retention
- Audit log of deletions
```

### F — Search by Content
```
- Search: "Invoice number 12345"
- OCR'd PDFs included in search
- Filters: type, date, tags, person
- Quick preview
```

### G — External Sharing
```
- Share invoice with auditor
- Generate signed URL (expires 7 days)
- Track access (who viewed when)
- Revoke any time
```

### H — Audit Trail
```
- Every action: upload, view, download, share, delete
- Immutable log
- Access reports per document
- Compliance ready
```

---

## 3. تدفق البيانات

```
[Upload]
POST /documents/upload (multipart)
   ↓ store in S3
   ↓ extract metadata
   ↓ if PDF/image → OCR
   ↓ AI auto-tag + classify
   ↓ create Document record
   ↓ index in search engine

[Expiry Tracking]
Cron daily:
   ↓ find documents with expiryDate
   ↓ alert at thresholds (90/30/7d)
   ↓ create renewal task

[Signing]
POST /documents/:id/send-for-signature
   ↓ create envelope (DocuSign)
   ↓ track status
   ↓ on completion → fetch signed
   ↓ replace original + lock
```

---

## 4. Schema

```prisma
model DocumentFolder {
  id              Int       @id @default(autoincrement())
  parentFolderId  Int?
  parentFolder    DocumentFolder? @relation("FolderTree", fields: [parentFolderId], references: [id])
  childFolders    DocumentFolder[] @relation("FolderTree")
  
  name            String
  path            String    // /HR/Salaries
  
  description     String?
  color           String?
  
  // Access
  visibility      String    @default("INHERIT")  // INHERIT | PUBLIC | RESTRICTED | PRIVATE
  allowedRoleIds  Int[]
  allowedUserIds  String[]
  
  retentionPolicy String?   // 'KEEP_FOREVER' | 'YEARS_X' | 'CUSTOM'
  retentionYears  Int?
  
  documents       Document[]
  
  createdByUserId String
  createdAt       DateTime  @default(now())
}

model Document {
  id              Int       @id @default(autoincrement())
  documentNumber  String    @unique
  folderId        Int?
  folder          DocumentFolder? @relation(fields: [folderId], references: [id])
  
  name            String
  description     String?
  
  type            String    // 'INVOICE' | 'CONTRACT' | 'KYC' | 'POLICY' | 'CERTIFICATE' | 'PHOTO' | 'OTHER'
  category        String?
  
  fileUrl         String
  fileName        String
  fileType        String    // MIME
  fileSizeBytes   BigInt
  fileHash        String    // SHA-256
  
  // Versioning
  version         Int       @default(1)
  parentDocumentId Int?     // for newer versions
  
  // Metadata
  metadata        Json?     // extracted fields
  
  // OCR
  ocrText         String?   @db.Text
  ocrCompleted    Boolean   @default(false)
  ocrConfidence   Decimal?  @db.Decimal(5,2)
  
  // AI
  aiTagged        Boolean   @default(false)
  aiClassification String?
  aiExtractedData Json?
  
  // Tags
  tags            String[]
  
  // Lifecycle
  expiryDate      DateTime?
  expiryNotificationSent Boolean @default(false)
  
  retentionUntil  DateTime?
  scheduledForDeletion DateTime?
  
  // Access control
  visibility      String    @default("INHERIT")
  
  // Linked records (polymorphic)
  linkedToType    String?   // 'CUSTOMER' | 'VENDOR' | 'EMPLOYEE' | 'INVOICE' | etc.
  linkedToId      Int?
  
  // E-sign
  signatureRequired Boolean @default(false)
  signatureStatus String?   // 'PENDING' | 'PARTIAL' | 'COMPLETE' | 'DECLINED'
  signedDocumentUrl String?
  
  // Compliance
  compliantForRegulation String[]  // ['SOX', 'GDPR', 'PDPL']
  immutable       Boolean   @default(false)
  
  uploadedByUserId String
  uploadedAt      DateTime  @default(now())
  
  archivedAt      DateTime?
  deletedAt       DateTime?
  
  versions        Document[] @relation("DocumentVersions")
  signatures      DocumentSignature[]
  shares          DocumentShare[]
  accessLogs      DocumentAccessLog[]
  
  @@index([linkedToType, linkedToId])
  @@index([type, uploadedAt])
  @@index([expiryDate])
}

model DocumentSignature {
  id              Int       @id @default(autoincrement())
  documentId      Int
  document        Document  @relation(fields: [documentId], references: [id])
  
  signerName      String
  signerEmail     String
  signerRole      String?
  
  signOrder       Int
  
  status          String    @default("PENDING")  // PENDING | SIGNED | DECLINED | EXPIRED
  
  signedAt        DateTime?
  signatureData   String?   @db.Text  // base64
  ipAddress       String?
  
  externalEnvelopeId String?
  externalProvider String?  // 'DOCUSIGN' | 'INTERNAL'
}

model DocumentShare {
  id              Int       @id @default(autoincrement())
  documentId      Int
  document        Document  @relation(fields: [documentId], references: [id])
  
  shareToken      String    @unique
  shareType       String    // 'INTERNAL_USER' | 'INTERNAL_ROLE' | 'EXTERNAL_LINK' | 'EMAIL'
  
  sharedWithUserId String?
  sharedWithEmail String?
  
  permissions     String[]  // 'VIEW' | 'DOWNLOAD' | 'COMMENT'
  
  expiresAt       DateTime?
  
  passwordProtected Boolean @default(false)
  passwordHash    String?
  
  accessCount     Int       @default(0)
  
  sharedByUserId  String
  sharedAt        DateTime  @default(now())
  revokedAt       DateTime?
}

model DocumentAccessLog {
  id              BigInt    @id @default(autoincrement())
  documentId      Int
  document        Document  @relation(fields: [documentId], references: [id])
  
  userId          String?
  externalShareId Int?
  
  action          String    // 'VIEW' | 'DOWNLOAD' | 'PRINT' | 'EDIT' | 'SHARE' | 'DELETE'
  
  ipAddress       String?
  userAgent       String?
  
  occurredAt      DateTime  @default(now())
  
  @@index([documentId, occurredAt])
  @@index([userId, occurredAt])
}

model DocumentExpiryAlert {
  // ... existing
  documentId      Int
  expiryDate      DateTime
  alertType       String    // 'EXPIRY' | 'RENEWAL_NEEDED' | 'PAST_DUE'
  thresholdDays   Int       // 90, 30, 7, 0
  
  status          String    @default("PENDING")  // PENDING | SENT | RENEWED | DISMISSED
  
  sentAt          DateTime?
  recipients      String[]
}

model DocumentRetentionPolicy {
  id              Int       @id @default(autoincrement())
  policyCode      String    @unique
  name            String
  
  documentTypes   String[]
  retentionYears  Int
  
  applicableRegulations String[]
  
  active          Boolean   @default(true)
}

model DocumentTemplate {
  id              Int       @id @default(autoincrement())
  templateCode    String    @unique
  name            String
  category        String
  
  fileUrl         String
  variables       String[]
  
  active          Boolean   @default(true)
}
```

---

## 5. Forms (8)

A: Document Upload (with auto-tagging)
B: Folder Creation (with permissions)
C: E-Signature Setup
D: Share Document
E: Retention Policy
F: Document Template Editor
G: Bulk Upload
H: Document Search (advanced)

---

## 6. Tables (8)

A: All Documents (with filters)
B: Folder Tree
C: Expiring Documents
D: Pending Signatures
E: Shared Documents
F: Access Log
G: Templates Library
H: Retention Schedule

---

## 7. Buttons (25+)

| Button | Color | Permission |
|--------|-------|------------|
| btn-upload | + رفع | 🟢 user |
| btn-bulk-upload | رفع جماعي | 🟦 admin |
| btn-folder-create | + مجلد | 🟢 owner |
| btn-folder-share | مشاركة المجلد | 🟦 owner |
| btn-document-rename | إعادة تسمية | 🟦 owner |
| btn-document-move | نقل | 🟦 owner |
| btn-document-version | إصدار جديد | 🟦 owner |
| btn-document-delete | حذف | 🔴 owner + permission |
| btn-document-restore | استعادة | 🟢 admin |
| btn-document-share-link | مشاركة برابط | 🟦 owner |
| btn-document-share-internal | مشاركة داخلي | 🟢 owner |
| btn-share-revoke | إلغاء المشاركة | 🔴 owner |
| btn-send-for-signature | إرسال للتوقيع | 🟢 owner |
| btn-sign-document | توقيع | 🟢 signer |
| btn-decline-sign | رفض | 🔴 signer |
| btn-template-create | + قالب | 🟢 admin |
| btn-template-fill | استخدام القالب | 🟢 user |
| btn-ocr-rerun | إعادة OCR | 🟦 admin |
| btn-ai-reclassify | إعادة تصنيف AI | 🟦 admin |
| btn-search-advanced | بحث متقدم | ⬜ user |
| btn-export-folder | تصدير مجلد ZIP | 🟦 owner |
| btn-retention-set | تعيين الاحتفاظ | 🟦 admin |
| btn-mark-immutable | تعليم كثابت | 🔴 admin |
| btn-access-log-view | عرض سجل الوصول | ⬜ owner |
| btn-bulk-tag | وسم جماعي | 🟦 admin |

---

## 8. Search & Filters

- Documents: type, folder, tags, expiry, uploader, date
- Full-text search (OCR included)
- Folders: parent, visibility
- Expiry: days remaining, type
- Shares: active, expiring

---

## 9. Reports

- Document Storage Usage
- Expiring Documents
- Pending Signatures
- Access Patterns
- Retention Compliance
- Most Accessed
- Top Uploaders

---

## 10. Dashboards

- KPIs: Total Documents / Storage Used / Expiring 30d / Pending Signatures
- Charts: Upload trend, Type distribution
- Lists: Recent uploads, Expiring soon, Awaiting my signature

---

## 11. Notifications

- Document expiring (90/30/7d)
- Signature requested
- Document shared with you
- Document accessed (high-value)
- Retention deletion scheduled
- Bulk upload complete

---

## 12. Permissions

| Action | User | Owner | Admin |
|--------|------|-------|-------|
| Upload | ✓ | ✓ | ✓ |
| View shared | ✓ | ✓ | ✓ |
| Edit own | ✓ | ✓ | ✓ |
| Delete own | ✗ admin only | ✓ | ✓ |
| Share | ✓ | ✓ | ✓ |
| Configure retention | ✗ | ✗ | ✓ |
| Mark immutable | ✗ | ✗ | ✓ |
| View access logs | own | own | all |

---

## 13. Integrations

- AWS S3 / Azure Blob
- DocuSign / SignNow
- OCR services (Textract, Gemini Vision, Tesseract)
- Search (Elasticsearch, Meilisearch)
- Office 365 / Google Workspace
- Email (forward + receive)

---

## 14. Shortcuts

- `Ctrl+U` Upload
- `Ctrl+F` Search
- `Ctrl+S` Signature

---

## 15. Mobile / Print

- Mobile: photo upload, signing, scanner
- Print: documents on demand

---

## 16. Audit

- All access logged
- Versions preserved
- Deletions auditable
- Compliance exports

---

## 17. Tests

```typescript
describe('Upload + OCR', () => { /* PDF, image, multi-page */ })
describe('Auto-tagging', () => { /* AI classification */ })
describe('Expiry Alerts', () => { /* threshold-based */ })
describe('E-signature', () => { /* sequential, parallel */ })
describe('Permissions', () => { /* folder inheritance */ })
describe('Search', () => { /* full-text, metadata */ })
describe('Retention', () => { /* auto-delete */ })
```

---

## 18. Edge Cases

| Case | Behavior |
|------|----------|
| Same hash uploaded twice | dedupe |
| OCR fails | manual retry |
| File > size limit | reject + alert |
| Signature expired before all signed | restart |
| External link accessed after revoke | 403 |
| Retention reached but legal hold | block deletion |
| Folder permissions cycle | detect + reject |

---

**نهاية #44** • 8 سيناريوهات • 8 جداول • 8 forms • 8 grids • 25 button • 7 reports
