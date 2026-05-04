# خطة سد النواقص — namainvist ERP v9.3
## Implementation Blueprint — Prompts + Scenarios + Data Flows + DB + UI

> **تاريخ:** 2026-05-04
> **الهدف:** سد 12 نقصاً رئيسياً للقفز من 59% إلى 78%+ خلال 6 أشهر
> **الاستخدام:** كل قسم يحتوي برومنت جاهز للنسخ، سيناريو عمل، تدفق بيانات، Schema، APIs، وأزرار UI

---

## فهرس النواقص (مرتب حسب الأولوية)

| # | النقص | الأولوية | التأثير على النسبة |
|---|-------|---------|---------------------|
| 1 | إصلاح TOTP/MFA الحقيقي | 🔴 CRITICAL | الأمن +15% |
| 2 | Year-End Close + Retained Earnings | 🔴 HIGH | المحاسبة 50→75% |
| 3 | Open Items Hardening (Multi-currency + Disputes) | 🔴 HIGH | AR 35→55% |
| 4 | Customer Statement PDF + Email | 🔴 HIGH | AR +10% |
| 5 | Dunning Letters Automation (Email/PDF) | 🔴 HIGH | AR +15% |
| 6 | Payment Runs مع SEPA/ACH/SARIE | 🔴 HIGH | AP 40→65% |
| 7 | Bank Statement Importer (CAMT.053/OFX) | 🟠 HIGH | Treasury 30→55% |
| 8 | Bank Reconciliation Exception Queue | 🟠 HIGH | Treasury +15% |
| 9 | Multi-Book / Multi-GAAP Activation | 🟠 MED | المحاسبة +10% |
| 10 | Revenue Recognition JE Posting (IFRS 15) | 🟠 MED | IFRS 40→70% |
| 11 | Lease Accounting JE Posting (IFRS 16) | 🟠 MED | IFRS 55→75% |
| 12 | Fixed Assets: Component + Impairment + Methods | 🟠 MED | FA 70→85% |

---

# 🔴 النقص 1: إصلاح TOTP/MFA الحقيقي

## السبب
الكود الحالي في `src/lib/totp.ts` يستخدم `token.length === 6` كتحقق وهمي — أي كود من 6 أرقام يمر. هذا **ثغرة أمنية حرجة**.

## البرومنت الجاهز

```
استبدل الكود الموجود في src/lib/totp.ts و src/lib/mfa-engine.ts بتنفيذ TOTP حقيقي حسب RFC 6238:

المتطلبات:
1. استخدم مكتبة `otplib` (npm install otplib)
2. السر (secret) يجب أن يُخزّن مشفّراً بـ AES-256-GCM في حقل User.totpSecretEncrypted
3. عند التفعيل (enable): ولّد QR code (otpauth://totp/namainvist:{email}?secret={base32}&issuer=namainvist)
4. عند التحقق (verify): استخدم authenticator.check(token, decryptedSecret) مع window=1 (يقبل ±30 ثانية)
5. أضف backup codes: 10 أكواد عشوائية (8 أحرف base32) مُجزّأة بـ bcrypt
6. أضف rate limit: 5 محاولات فاشلة خلال 15 دقيقة → قفل المستخدم
7. أضف audit log لكل محاولة: نجاح/فشل + IP + User-Agent
8. عند التفعيل لأول مرة: اطلب من المستخدم إدخال كود صحيح قبل تفعيل MFA فعلياً (TOTP enrollment confirmation)

اختبارات مطلوبة:
- token صحيح يمر
- token قديم (>30 ثانية) يُرفض
- token مكرر يُرفض (replay protection)
- backup code يعمل مرة واحدة فقط
- 6 محاولات فاشلة → القفل
```

## السيناريو (User Story)

```
بصفتي محاسب رئيسي،
أريد تفعيل المصادقة الثنائية على حسابي
حتى لا يستطيع أحد الدخول حتى لو سرّب كلمة السر.

السيناريو:
1. أضغط "تفعيل MFA" في إعدادات حسابي
2. يظهر QR code → أمسحه بتطبيق Google Authenticator
3. أدخل الكود الحالي للتأكيد
4. يظهر لي 10 backup codes → أحفظها
5. عند تسجيل الدخول لاحقاً: بعد كلمة السر، يطلب الكود
6. إذا فقدت الجهاز: أستخدم backup code
```

## تدفق البيانات (Data Flow)

```
[Settings UI] → POST /api/auth/mfa/enroll
                ↓
              Generate Secret (otplib.authenticator.generateSecret)
                ↓
              Encrypt secret (AES-256-GCM, key from env)
                ↓
              Store: User.totpSecretEncrypted = ciphertext
                     User.mfaPendingActivation = true
                ↓
              Generate QR (otpauth://...) + return base64 PNG
                ↓
[User scans QR + enters code] → POST /api/auth/mfa/confirm { code }
                ↓
              Decrypt secret → authenticator.check(code, secret)
                ↓
              ✓ → User.mfaEnabled = true, generate 10 backup codes (bcrypt hashed)
                ↓
              Return backup codes (one-time display)

[Login Flow]: POST /api/auth/login → if user.mfaEnabled → return { requiresMfa: true, sessionToken }
              POST /api/auth/mfa/verify { sessionToken, code }
                ↓
              Rate limit check (5/15min) → audit log → verify → issue full JWT
```

## Prisma Schema (تعديلات)

```prisma
model User {
  // ... existing fields
  totpSecretEncrypted   String?   @db.Text  // base64 ciphertext
  totpIv                String?   @db.VarChar(32)
  totpAuthTag           String?   @db.VarChar(32)
  mfaEnabled            Boolean   @default(false)
  mfaPendingActivation  Boolean   @default(false)
  mfaEnrolledAt         DateTime?
  mfaFailedAttempts     Int       @default(0)
  mfaLockedUntil        DateTime?
  backupCodes           UserBackupCode[]
  mfaAttempts           MfaAttempt[]
}

model UserBackupCode {
  id          Int       @id @default(autoincrement())
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  codeHash    String    // bcrypt
  usedAt      DateTime?
  createdAt   DateTime  @default(now())
  @@index([userId])
}

model MfaAttempt {
  id          Int       @id @default(autoincrement())
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  success     Boolean
  ipAddress   String?
  userAgent   String?
  attemptedAt DateTime  @default(now())
  method      String    // 'totp' | 'backup_code'
  @@index([userId, attemptedAt])
}
```

## API Endpoints

```
POST   /api/auth/mfa/enroll          → يبدأ التفعيل، يرجع QR
POST   /api/auth/mfa/confirm         → يؤكد التفعيل بعد إدخال كود صحيح
POST   /api/auth/mfa/verify          → يتحقق وقت تسجيل الدخول
POST   /api/auth/mfa/disable         → إلغاء التفعيل (يحتاج كلمة سر + كود)
POST   /api/auth/mfa/regenerate-codes → توليد backup codes جديدة
GET    /api/auth/mfa/status          → هل MFA مفعل؟
POST   /api/auth/mfa/backup-verify   → تسجيل الدخول بـ backup code
```

## أزرار وعناصر UI

| الصفحة | المكان | الزر/العنصر | التصرف |
|--------|--------|-------------|--------|
| `/settings/security` | بطاقة "المصادقة الثنائية" | زر `تفعيل MFA` | يفتح Modal مع QR |
| Modal التفعيل | — | حقل `أدخل الكود من Google Authenticator` | onSubmit → /confirm |
| Modal النجاح | — | جدول `Backup Codes` + زر `نسخ` + زر `طباعة` | تنبيه: "احفظها الآن!" |
| `/login` (بعد كلمة السر) | — | حقل `كود MFA` (6 أرقام) + رابط `استخدم backup code` | onSubmit → /verify |
| `/settings/security` | بطاقة MFA المفعلة | زر `إلغاء التفعيل` (أحمر) + زر `توليد backup codes` | confirmation modal |

---

# 🔴 النقص 2: Year-End Close + Retained Earnings Rollover

## السبب
`src/lib/period-close.ts` يدعم soft/hard close لكن **لا يقفل السنة المالية تلقائياً**. القيود الإلزامية المفقودة:
- إقفال حسابات الدخل/المصاريف → الأرباح المحتجزة
- ترحيل الأرصدة الافتتاحية للسنة الجديدة
- توليد قيد الإقفال السنوي

## البرومنت الجاهز

```
أنشئ src/lib/year-end-close.ts و src/app/api/accounting/year-end-close/route.ts

المنطق المحاسبي (يجب موافقة CPA):

1. validateYearReadiness(fiscalYearId):
   - كل الفترات الشهرية مغلقة (HARD_CLOSED)
   - كل reconciliations منتهية
   - لا توجد قيود draft
   - كل auto-journal queue فارغ
   - إذا فشل → ارجع قائمة الأخطاء

2. preCloseChecklist(fiscalYearId): يولّد checklist بـ 25 مهمة:
   - FX Revaluation منفّذ
   - Depreciation runs منتهية
   - Lease amortization منتهية
   - WIP roll-forward منتهي
   - Inventory cycle count مكتمل
   - Bank reconciliations منتهية
   - AR/AP aging محدثة
   - Accruals مسجّلة
   - Prepayments expensed
   - Provisions مراجعة (ECL, bad debt, warranty)
   - ... إلخ

3. closeIncomeStatement(fiscalYearId, retainedEarningsAccountId):
   - اجمع كل أرصدة حسابات 4xxx (Revenue) و 5xxx (Expenses)
   - أنشئ JE واحد:
     DR كل حساب إيراد بقيمة رصيده الدائن
     CR كل حساب مصروف بقيمة رصيده المدين
     الفرق → DR/CR للأرباح المحتجزة (3xxx)
   - أعطه نوع: YEAR_END_CLOSING
   - رحّله (POSTED) في آخر يوم من السنة المالية

4. rolloverOpeningBalances(fromFiscalYearId, toFiscalYearId):
   - لكل حساب من نوع Asset/Liability/Equity:
     - احسب الرصيد الختامي
     - أنشئ OpeningBalance record للسنة الجديدة
   - حسابات Revenue/Expense → رصيد افتتاحي = 0
   - اربط القيد بنوع: OPENING_BALANCE_BROUGHT_FORWARD

5. lockFiscalYear(fiscalYearId):
   - FiscalYear.status = LOCKED
   - منع أي قيد بتاريخ ضمن السنة
   - فقط مدير عام بصلاحية SUPER_ADMIN يستطيع unlock

6. generateClosingReports(fiscalYearId):
   - Trial Balance (Final)
   - Income Statement
   - Balance Sheet
   - Cash Flow Statement
   - Statement of Changes in Equity
   - تخزينها كـ snapshots (ImmutableReport)

كل خطوة لها endpoint مستقل + UI button. كل عملية تتطلب 2-step confirmation.
استخدم Prisma transactions مع SERIALIZABLE isolation.
سجّل كل خطوة في AuditLog مع userId, timestamp, beforeState, afterState.
```

## السيناريو

```
بصفتي محاسب رئيسي في نهاية السنة المالية (31/12):

1. أضغط "بدء إقفال السنة" → يظهر checklist بـ 25 مهمة
2. كل مهمة لها حالة (pending/done/skipped) — أضغط "تشغيل تلقائي" للمهام القابلة (FX reval, depreciation)
3. للمهام اليدوية (e.g. "مراجعة inventory count") أرفع المستندات وأضع علامة done
4. عند اكتمال 100% → زر "إقفال قائمة الدخل" يصبح فعّالاً
5. يعرض لي معاينة القيد (يمكن أكثر من 200 سطر) قبل الترحيل
6. أؤكد → القيد يُرحّل + تظهر شاشة "ترحيل الأرصدة الافتتاحية"
7. أؤكد → السنة تُقفل (LOCKED)
8. تُولَّد التقارير الختامية (snapshot) ويتم تنزيلها PDF
```

## تدفق البيانات

```
[Year-End Wizard UI]
   ↓
Step 1: GET /api/accounting/year-end-close/validate?fiscalYearId=X
        → returns { ready: false, errors: [...] }
   ↓
Step 2: GET /api/accounting/year-end-close/checklist?fiscalYearId=X
        → returns 25 tasks with status
   ↓
Step 3: POST /api/accounting/year-end-close/run-task
        { fiscalYearId, taskCode: 'FX_REVALUATION' }
        → executes via fx-revaluation engine
   ↓
[All tasks done]
   ↓
Step 4: POST /api/accounting/year-end-close/preview-closing-je
        → returns JE preview (lines)
   ↓
Step 5: POST /api/accounting/year-end-close/post-closing-je
        { fiscalYearId, retainedEarningsAccountId, confirmationToken }
        → creates JE + posts + saves YearEndCloseRun
   ↓
Step 6: POST /api/accounting/year-end-close/rollover-balances
        { fromFiscalYearId, toFiscalYearId, confirmationToken }
        → creates opening balances + JE
   ↓
Step 7: POST /api/accounting/year-end-close/lock-year
        { fiscalYearId, confirmationToken }
        → FiscalYear.status = LOCKED
   ↓
Step 8: POST /api/accounting/year-end-close/generate-final-reports
        → returns 5 immutable PDF snapshots
```

## Prisma Schema (إضافات)

```prisma
model FiscalYear {
  // ... existing
  status              FiscalYearStatus  @default(OPEN)
  closedAt            DateTime?
  closedByUserId      String?
  closingJournalId    Int?
  rolloverJournalId   Int?
}

enum FiscalYearStatus {
  OPEN
  CLOSING_IN_PROGRESS
  LOCKED
}

model YearEndCloseRun {
  id                  Int       @id @default(autoincrement())
  fiscalYearId        Int
  fiscalYear          FiscalYear @relation(fields: [fiscalYearId], references: [id])
  startedAt           DateTime  @default(now())
  startedByUserId     String
  completedAt         DateTime?
  status              String    // 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'ROLLED_BACK'
  checklist           YearEndCloseTask[]
  closingJournalId    Int?
  rolloverJournalId   Int?
  finalReportSnapshots Json?
  errors              Json?
}

model YearEndCloseTask {
  id              Int       @id @default(autoincrement())
  runId           Int
  run             YearEndCloseRun @relation(fields: [runId], references: [id])
  taskCode        String    // 'FX_REVALUATION' | 'DEPRECIATION' | ...
  taskName        String
  status          String    // 'pending' | 'in_progress' | 'done' | 'skipped' | 'failed'
  assigneeUserId  String?
  startedAt       DateTime?
  completedAt     DateTime?
  evidenceFileId  Int?
  notes           String?
  result          Json?
  @@index([runId, status])
}

model OpeningBalance {
  id              Int       @id @default(autoincrement())
  fiscalYearId    Int
  accountId       Int
  amountDebit     Decimal   @db.Decimal(20,4)
  amountCredit    Decimal   @db.Decimal(20,4)
  currency        String    @default("SAR")
  costCenterId    Int?
  branchId        Int?
  createdAt       DateTime  @default(now())
  sourceJournalId Int       // OPENING_BALANCE_BROUGHT_FORWARD
  @@unique([fiscalYearId, accountId, costCenterId, branchId])
  @@index([fiscalYearId, accountId])
}

model ImmutableReport {
  id              Int       @id @default(autoincrement())
  fiscalYearId    Int?
  reportType      String    // 'TRIAL_BALANCE' | 'P&L' | 'BS' | 'CF' | 'EQUITY_CHANGES'
  generatedAt     DateTime  @default(now())
  generatedByUserId String
  payload         Json      // full report data
  pdfFileUrl      String?
  hash            String    // SHA-256 of payload (tamper detection)
  @@index([fiscalYearId, reportType])
}
```

## API Endpoints

```
GET    /api/accounting/year-end-close/validate?fiscalYearId
GET    /api/accounting/year-end-close/checklist?fiscalYearId
POST   /api/accounting/year-end-close/start
POST   /api/accounting/year-end-close/run-task
POST   /api/accounting/year-end-close/skip-task
POST   /api/accounting/year-end-close/preview-closing-je
POST   /api/accounting/year-end-close/post-closing-je
POST   /api/accounting/year-end-close/rollover-balances
POST   /api/accounting/year-end-close/lock-year
POST   /api/accounting/year-end-close/generate-final-reports
POST   /api/accounting/year-end-close/unlock-year (SUPER_ADMIN only)
GET    /api/accounting/year-end-close/runs
GET    /api/accounting/year-end-close/runs/:id
```

## أزرار UI

| الصفحة | الزر | اللون | الشرط |
|--------|------|-------|-------|
| `/accounting/period-close` | `بدء إقفال السنة` | 🟦 Primary | كل الفترات الشهرية مقفلة |
| Wizard - Step 1 | `تحقق من الجاهزية` | 🟦 | — |
| Wizard - Step 2 | `تشغيل تلقائي للمهمة` | 🟢 | لكل مهمة قابلة للأتمتة |
| Wizard - Step 2 | `رفع مستند الإثبات` | ⬜ | للمهام اليدوية |
| Wizard - Step 3 | `معاينة قيد الإقفال` | 🟦 | كل المهام done |
| Wizard - Step 4 | `ترحيل قيد الإقفال` | 🔴 Confirm | confirmation modal مع كتابة "أؤكد" |
| Wizard - Step 5 | `ترحيل الأرصدة للسنة الجديدة` | 🔴 Confirm | بعد ترحيل الإقفال |
| Wizard - Step 6 | `قفل السنة المالية` | 🔴 Confirm | بعد ترحيل الأرصدة |
| Wizard - Step 7 | `توليد التقارير الختامية` | 🟦 | بعد القفل — PDFs تنزل تلقائياً |

---

# 🔴 النقص 3: Open Items Hardening (Multi-currency + Disputes)

## السبب
الكود الحالي `src/lib/open-items.ts` يدعم FIFO فقط بـ SAR. يفتقد: multi-currency مع FX gain/loss، dispute marking، writeoff workflow، tolerance.

## البرومنت الجاهز

```
وسّع src/lib/open-items.ts لدعم:

1. Multi-currency Open Items:
   - أضف حقول: currency, originalAmount, originalOpenAmount, exchangeRate
   - عند الـ matching: احسب FX gain/loss
   - أنشئ JE للفرق على حساب 5xxx-FX_GAIN_LOSS

2. Dispute Management:
   - أضف status جديد: DISPUTED
   - markAsDisputed(openItemId, reason, expectedResolutionDate, disputedAmount)
   - يستثني المبلغ المتنازع عليه من dunning
   - resolveDispute(openItemId, resolution: 'CUSTOMER_PAYS' | 'WRITEOFF' | 'CREDIT_NOTE')

3. Tolerance Auto-Match:
   - إذا الفرق < tolerance (مثلاً 1 SAR) → اعتبره مطابق
   - أنشئ JE صغير لـ writeoff/rounding

4. Partial Application مع Discount:
   - applyPaymentWithDiscount(paymentId, invoiceId, paymentAmount, discountAmount, discountReason)
   - اخصم الـ discount من الإيراد (DR Sales Discount)

5. Reverse Application:
   - reverseApplication(applicationId, reason, userId)
   - أعد المبالغ لحالتها قبل الـ matching
   - أنشئ reversal JE

6. Open Items Aging Report:
   - aging buckets: 0-30, 31-60, 61-90, 91-120, >120
   - per customer + per currency
   - مع disputed/under-litigation flags

كل عملية تستخدم Prisma transaction.
كل تعديل يولد AuditLog + FieldAuditLog.
```

## السيناريو

```
حالة 1 - Multi-currency:
عميل لديه فاتورة 1000 USD (= 3750 SAR @ 3.75)
دفع بعد شهر 1000 USD (= 3780 SAR @ 3.78)
→ Open Item يُغلق + يولد JE: DR Cash 3780 / CR AR 3750 / CR FX Gain 30

حالة 2 - Dispute:
فاتورة 5000 SAR، العميل يقول "بضاعة معيبة بقيمة 800"
→ المحاسب يضغط "وضع نزاع" → يُدخل 800 + سبب
→ Open Item يصبح: openAmount 5000، disputedAmount 800
→ Dunning يستثني الـ 800 ولا يطلب إلا 4200
→ بعد الحل: المحاسب يضغط "حل النزاع" → CREDIT_NOTE → 800 تُخصم

حالة 3 - Tolerance:
فاتورة 10000.50، العميل دفع 10000
→ الفرق 0.50 < 1 SAR → auto-match + JE writeoff 0.50 على حساب Rounding
```

## تدفق البيانات

```
[Cash Application Screen]
   ↓
   اختر payment + اختر invoice(s) + اختر discount/writeoff
   ↓
POST /api/accounting/open-items/apply-payment
   { paymentOpenItemId, allocations: [{invoiceOpenItemId, amount, discount?, writeoff?}] }
   ↓
   لكل allocation:
     - تحقق من العملة
     - إذا مختلفة: احسب FX
     - حدّث openAmount لكلا السجلين
     - إذا openAmount = 0 → status = CLEARED
     - أنشئ ItemApplication record
   ↓
   أنشئ JE موحد:
     DR Cash (currency)
     CR AR/AP (currency, FX-converted)
     DR/CR FX Gain/Loss (الفرق)
     DR Sales Discount (إن وجد)
     DR Bad Debt (للـ writeoff)
   ↓
   commit transaction
   ↓
   إرجاع: { matchedAmount, fxGainLoss, remainingPaymentBalance }
```

## Prisma Schema (إضافات)

```prisma
model OpenItem {
  // ... existing fields
  currency            String    @default("SAR")
  originalAmount      Decimal   @db.Decimal(20,4)
  originalOpenAmount  Decimal   @db.Decimal(20,4)
  exchangeRate        Decimal   @db.Decimal(20,8) @default(1)
  disputedAmount      Decimal?  @db.Decimal(20,4)
  disputedReason      String?
  disputedAt          DateTime?
  disputedByUserId    String?
  disputeResolvedAt   DateTime?
  disputeResolution   String?   // 'CUSTOMER_PAYS' | 'WRITEOFF' | 'CREDIT_NOTE'
  applications        ItemApplication[]      @relation("OpenItemApplications")
  appliedTo           ItemApplication[]      @relation("AppliedToOpenItem")
  
  @@index([partyId, partyType, status, currency])
  @@index([dueDate, status])
}

model ItemApplication {
  id                  Int       @id @default(autoincrement())
  paymentOpenItemId   Int
  paymentOpenItem     OpenItem  @relation("OpenItemApplications", fields: [paymentOpenItemId], references: [id])
  invoiceOpenItemId   Int
  invoiceOpenItem     OpenItem  @relation("AppliedToOpenItem", fields: [invoiceOpenItemId], references: [id])
  appliedAmount       Decimal   @db.Decimal(20,4)
  appliedCurrency     String
  exchangeRateUsed    Decimal   @db.Decimal(20,8)
  fxGainLoss          Decimal?  @db.Decimal(20,4)
  discountAmount      Decimal?  @db.Decimal(20,4)
  writeoffAmount      Decimal?  @db.Decimal(20,4)
  writeoffReason      String?
  appliedAt           DateTime  @default(now())
  appliedByUserId     String
  journalEntryId      Int?
  reversedAt          DateTime?
  reversedByUserId    String?
  reversalReason      String?
  reversalJournalId   Int?
  @@index([paymentOpenItemId])
  @@index([invoiceOpenItemId])
}
```

## API Endpoints

```
POST   /api/accounting/open-items/apply-payment       (multi-allocation)
POST   /api/accounting/open-items/auto-apply          (FIFO/LIFO/LARGEST)
POST   /api/accounting/open-items/mark-disputed
POST   /api/accounting/open-items/resolve-dispute
POST   /api/accounting/open-items/reverse-application
GET    /api/accounting/open-items/aging?asOfDate&customerId&currency
GET    /api/accounting/open-items/by-party/:partyType/:partyId
POST   /api/accounting/open-items/writeoff             (bad debt)
GET    /api/accounting/open-items/disputes
```

## أزرار UI

| الصفحة | الزر | الموقع |
|--------|------|--------|
| `/accounting/cash-application` | `تطبيق دفعة` | شاشة فرد بـ drag-drop allocation |
| `/accounting/cash-application` | `Auto-Apply (FIFO)` | بجوار كل عميل |
| `/accounting/customers/:id/open-items` | `وضع نزاع` 🟡 | بجوار كل فاتورة OPEN |
| Modal النزاع | حقل مبلغ + سبب + تاريخ متوقع | onSubmit → mark-disputed |
| `/accounting/disputes` | جدول النزاعات + زر `حل النزاع` لكل صف | dropdown: customer-pays / writeoff / credit-note |
| `/accounting/open-items/:id` | `عرض الـ applications` + `عكس` 🔴 | لكل application |
| `/accounting/aging-report` | `تصدير Excel/PDF` + فلاتر currency | — |
| كل صف فاتورة | badge يوضح: 💵 currency + ⚠️ disputed | — |

---

# 🔴 النقص 4: Customer Statement PDF + Email Automation

## السبب
الكود الحالي `src/lib/customer-statement.ts` يولد بيانات JSON فقط — بلا PDF أو email أو scheduling.

## البرومنت الجاهز

```
أنشئ:
1. src/lib/customer-statement-pdf.ts — يستخدم pdf-lib أو puppeteer لتوليد PDF بالعربية (RTL)
2. src/lib/customer-statement-scheduler.ts — Cron job شهري + on-demand
3. src/app/api/accounting/customer-statements/* — endpoints متكاملة

المتطلبات:
1. PDF Template (RTL Arabic + LTR English):
   - Header: شعار الشركة + بياناتها + الرقم الضريبي
   - بيانات العميل: الاسم، الكود، حد الائتمان، الرصيد
   - فترة الكشف: من / إلى
   - جدول المعاملات: التاريخ، نوع المستند، الرقم، البيان، مدين، دائن، رصيد جاري
   - تحليل الأعمار: 0-30 / 31-60 / 61-90 / 91-120 / >120
   - الإجمالي + رصيد مستحق
   - QR code يحتوي ملخص الكشف
   - توقيع الكتروني للمحاسب (اختياري)

2. Email Automation:
   - Settings للعميل: emailStatementsEnabled, statementFrequency (NEVER/MONTHLY/QUARTERLY)
   - Cron يعمل كل أول من الشهر يجلب العملاء enabled + frequency=MONTHLY
   - يولد PDF + يرسل بـ Nodemailer/SendGrid
   - يسجل StatementDispatchLog: { customerId, sentAt, pdfUrl, emailMessageId, status }

3. Templates مخصصة:
   - StatementTemplate: { id, name, headerHtml, footerHtml, includeAging, includeQR, language }
   - كل عميل يمكن ربطه بـ template معين

4. Bulk Actions:
   - generateBulkStatements({ customerIds, dateFrom, dateTo, sendEmail }) → background job
   - يستخدم BullMQ أو محرك queue

5. Customer Portal Access:
   - العميل يستطيع تنزيل كشفه السابق من بوابة B2B
   - GET /api/portal/my-statements → محمي بـ B2B JWT
```

## السيناريو

```
سيناريو 1 - Manual:
المحاسب يفتح بطاقة العميل "شركة الأمل" → يضغط "إنشاء كشف حساب"
→ يختار الفترة (مثلاً 1/1/2026 - 31/3/2026) → معاينة → "تنزيل PDF" + "إرسال Email"

سيناريو 2 - Automated:
في 1/2/2026 الساعة 6 صباحاً، Cron job يبدأ:
- يجلب 850 عميل لديهم emailStatementsEnabled=true + frequency=MONTHLY
- يصنفهم في batches من 50
- لكل عميل: يولد PDF + يرسل
- بعد ساعتين: 845 ✓ + 5 فشل (email غير صحيح) → تنبيه للمحاسب

سيناريو 3 - Customer Portal:
العميل يدخل بوابته → "كشوفاتي" → يرى آخر 12 شهر → ينزل أي كشف PDF
```

## تدفق البيانات

```
[Customer Detail Page] → "إنشاء كشف"
   ↓
GET /api/accounting/customer-statements/preview?customerId=X&from&to
   ↓
   builds: { openingBalance, transactions[], closingBalance, aging }
   ↓
   عرض في الـ UI كجدول
   ↓
"تنزيل PDF" → POST /api/accounting/customer-statements/generate-pdf
   ↓
   يولد PDF (pdf-lib) + يرفعه على cloud-storage → يرجع URL
   ↓
"إرسال Email" → POST /api/accounting/customer-statements/send-email
   { customerId, pdfUrl, emailTemplate }
   ↓
   يرسل عبر Nodemailer + يسجل StatementDispatchLog

[Cron Job - Monthly]
   ↓
   GET customers WHERE emailStatementsEnabled=true AND frequency=MONTHLY
   ↓
   for each customer (in queue):
     generate PDF → send email → log result
   ↓
   send summary to accountant
```

## Prisma Schema (إضافات)

```prisma
model Customer {
  // ... existing
  emailStatementsEnabled  Boolean   @default(false)
  statementFrequency      String    @default("NEVER")  // NEVER | MONTHLY | QUARTERLY | YEARLY
  statementEmail          String?   // override من email الافتراضي
  statementTemplateId     Int?
  statementTemplate       StatementTemplate? @relation(fields: [statementTemplateId], references: [id])
  statementDispatchLogs   StatementDispatchLog[]
}

model StatementTemplate {
  id              Int       @id @default(autoincrement())
  name            String
  language        String    @default("ar")  // ar | en | bilingual
  headerHtml      String?   @db.Text
  footerHtml      String?   @db.Text
  includeAging    Boolean   @default(true)
  includeQR       Boolean   @default(true)
  signatureFileId Int?
  customers       Customer[]
  createdAt       DateTime  @default(now())
}

model StatementDispatchLog {
  id              Int       @id @default(autoincrement())
  customerId      Int
  customer        Customer  @relation(fields: [customerId], references: [id])
  dateFrom        DateTime
  dateTo          DateTime
  generatedAt     DateTime  @default(now())
  pdfUrl          String?
  emailSentTo     String?
  emailMessageId  String?
  status          String    // 'GENERATED' | 'SENT' | 'FAILED' | 'BOUNCED'
  errorMessage    String?
  triggeredBy     String    // 'MANUAL' | 'CRON' | 'PORTAL'
  triggeredByUserId String?
  @@index([customerId, generatedAt])
}
```

## API Endpoints

```
GET    /api/accounting/customer-statements/preview?customerId&from&to
POST   /api/accounting/customer-statements/generate-pdf
POST   /api/accounting/customer-statements/send-email
POST   /api/accounting/customer-statements/bulk-generate
GET    /api/accounting/customer-statements/dispatch-logs
GET    /api/accounting/customer-statements/templates
POST   /api/accounting/customer-statements/templates
PUT    /api/accounting/customer-statements/templates/:id

# Customer Portal
GET    /api/portal/my-statements (B2B auth)
GET    /api/portal/my-statements/:id/pdf
```

## أزرار UI

| الصفحة | الزر |
|--------|------|
| `/accounting/customers/:id` | بطاقة "كشوف الحساب" مع زر `إنشاء كشف جديد` |
| Modal الكشف | اختيار فترة (تواريخ) + قالب + checkbox `أرسل بالبريد` |
| نتيجة الكشف | `تنزيل PDF` 🟢 + `إرسال Email` 🟦 + `طباعة` ⬜ |
| `/accounting/customers/:id/settings` | toggle `إرسال الكشف الشهري تلقائياً` + dropdown frequency + email override |
| `/accounting/statements/dispatch-log` | جدول كل الإرسالات مع status + زر `إعادة إرسال` للفاشلة |
| `/accounting/statements/templates` | CRUD للقوالب مع preview live |
| `/accounting/statements/bulk` | اختيار عملاء بـ checkbox + زر `توليد كشوف لـ X عميل` |
| Customer B2B Portal `/my-account/statements` | جدول `كشوفاتي` + زر تنزيل PDF لكل صف |

---

# 🔴 النقص 5: Dunning Letters Automation (Email + PDF + Multi-template)

## السبب
`src/lib/dunning-engine.ts` يحدد المستوى لكن **لا يولد letter PDF** ولا يرسل email.

## البرومنت الجاهز

```
وسّع src/lib/dunning-engine.ts:

1. توليد PDF letter لكل مستوى:
   - Level 1 (15 يوم تأخير): تذكير ودي بالعربية
   - Level 2 (30 يوم): تذكير رسمي + رسوم 50 SAR
   - Level 3 (60 يوم): إنذار قانوني + فائدة تأخير 1.5%/شهر
   - Level 4 (90 يوم): تحويل لإجراء قانوني + بلوك حساب العميل
   - كل level له template HTML قابل للتعديل من الـ UI

2. Email + WhatsApp:
   - send via Nodemailer (email)
   - send via WhatsApp API (إذا متاح في Settings.whatsappEnabled)
   - log في DunningCommunication

3. Customer Block Logic:
   - عند Level 3/4 → Customer.creditHold = true
   - يمنع إصدار فواتير مبيعات جديدة (ما لم يوافق Manager)

4. Late Fee + Interest:
   - Level 2: late_fee = 50 SAR (configurable)
   - Level 3+: interest = openAmount * (1.5% / 30) * daysOverdue
   - تُضاف كـ JE: DR AR / CR Late Fee Income

5. Dunning Run Scheduling:
   - Cron يومي 8 ص: يفحص كل OpenItems > dueDate
   - يحدد المستوى المناسب
   - يتجاوز الفواتير المتنازع عليها (status=DISPUTED)
   - batch processing مع queue

6. Snooze / Skip:
   - المحاسب يستطيع snooze عميل معين لـ X يوم
   - أو skip فاتورة محددة (مع سبب)

7. Promise to Pay:
   - عند الاتصال بالعميل: المحاسب يسجل "وعد بالدفع في X"
   - dunning يتجاوز الفاتورة حتى تاريخ الوعد
   - إذا فات الوعد بدون دفع → Level أعلى مباشرة

8. Reports:
   - Dunning Effectiveness: ٪ الفواتير اللي تم تحصيلها بعد كل مستوى
   - Time to Collect (DSO): متوسط الأيام للتحصيل
```

## السيناريو

```
سيناريو 1 - Cron يومي:
8 صباحاً → Cron يبدأ
- يفحص 1,250 فاتورة overdue
- 80 فاتورة متنازع عليها → تجاوز
- 200 فاتورة بـ promise-to-pay لم يحن موعدها → تجاوز
- 970 فاتورة:
  - 500 → Level 1 (تذكير ودي)
  - 280 → Level 2 (رسمي + رسوم 50)
  - 150 → Level 3 (إنذار + فائدة)
  - 40 → Level 4 (قانوني + bloque)
- يولد PDFs + يرسل emails + يسجل في DunningLetter
- يولد JEs للرسوم والفوائد
- 40 عميل يصبحون creditHold=true
- تنبيه للمحاسب: "تم تحويل 40 عميل لـ legal action"

سيناريو 2 - Promise to Pay:
محاسب يتصل بعميل overdue → يسجل "وعد بالدفع 15/5"
→ Dunning يتجاوزه حتى 16/5
→ في 16/5 إذا لم يدفع → ينتقل لمستوى أعلى تلقائياً
```

## تدفق البيانات

```
[Cron Daily 8AM] → DunningEngine.executeDailyRun()
   ↓
   getOverdueOpenItems() (excluding DISPUTED, snoozed, promise-to-pay future)
   ↓
   for each item:
     - calculate daysOverdue
     - find applicable level
     - check if letter already sent at this level
     - if new level → create DunningLetter + DunningCommunication
     - generate PDF (puppeteer)
     - send email (Nodemailer) + log
     - if WhatsApp enabled → send via WhatsApp API
     - if level >= 3 → create JE for late fee + interest
     - if level == 4 → Customer.creditHold = true
   ↓
   summary report → email to accountant
```

## Prisma Schema (إضافات)

```prisma
model DunningLevel {
  // ... existing
  templateHtml        String    @db.Text
  templateLanguage    String    @default("ar")
  lateFeeAmount       Decimal?  @db.Decimal(10,2)
  interestRatePercent Decimal?  @db.Decimal(5,2)  // monthly
  blockCustomer       Boolean   @default(false)
  sendEmail           Boolean   @default(true)
  sendWhatsApp        Boolean   @default(false)
  legalAction         Boolean   @default(false)
}

model DunningLetter {
  // ... existing
  pdfUrl              String?
  lateFeeAmount       Decimal?  @db.Decimal(10,2)
  interestAmount      Decimal?  @db.Decimal(10,2)
  lateFeeJournalId    Int?
  communications      DunningCommunication[]
  snoozedUntil        DateTime?
  snoozedReason       String?
  snoozedByUserId     String?
}

model DunningCommunication {
  id                Int       @id @default(autoincrement())
  letterId          Int
  letter            DunningLetter @relation(fields: [letterId], references: [id])
  channel           String    // 'EMAIL' | 'WHATSAPP' | 'SMS' | 'PHONE_CALL' | 'PHYSICAL_MAIL'
  sentAt            DateTime  @default(now())
  recipientAddress  String
  status            String    // 'SENT' | 'DELIVERED' | 'OPENED' | 'BOUNCED' | 'FAILED'
  externalMessageId String?
  errorMessage      String?
  responseReceived  String?
  @@index([letterId])
}

model PromiseToPay {
  id                Int       @id @default(autoincrement())
  customerId        Int
  customer          Customer  @relation(fields: [customerId], references: [id])
  openItemId        Int?
  promisedAmount    Decimal   @db.Decimal(20,4)
  promisedDate      DateTime
  status            String    @default("ACTIVE")  // ACTIVE | KEPT | BROKEN | CANCELLED
  recordedByUserId  String
  recordedAt        DateTime  @default(now())
  notes             String?
  followUpDate      DateTime?
  @@index([customerId, status])
}

model Customer {
  // ... existing
  creditHold              Boolean   @default(false)
  creditHoldReason        String?
  creditHoldDate          DateTime?
  creditHoldByUserId      String?
  dunningSnoozeUntil      DateTime?
  promisesToPay           PromiseToPay[]
}
```

## API Endpoints

```
POST   /api/accounting/dunning/execute-daily-run        (cron-only)
POST   /api/accounting/dunning/execute-for-customer
GET    /api/accounting/dunning/letters?customerId&level&dateFrom
GET    /api/accounting/dunning/letters/:id/pdf
POST   /api/accounting/dunning/letters/:id/resend
POST   /api/accounting/dunning/letters/:id/snooze
POST   /api/accounting/dunning/promise-to-pay
PUT    /api/accounting/dunning/promise-to-pay/:id/mark-kept
PUT    /api/accounting/dunning/promise-to-pay/:id/mark-broken
GET    /api/accounting/dunning/levels
PUT    /api/accounting/dunning/levels/:id (template + fees)
POST   /api/accounting/dunning/customer/:id/release-hold
GET    /api/accounting/dunning/effectiveness-report
GET    /api/accounting/dunning/dso-report
```

## أزرار UI

| الصفحة | الزر |
|--------|------|
| `/accounting/dunning/dashboard` | KPIs (overdue total، DSO، collection rate) + زر `تشغيل dunning الآن` |
| `/accounting/dunning/levels` | جدول 4 مستويات + زر `تعديل القالب` + زر `معاينة` |
| Modal Template Editor | محرر HTML rich-text + variables {{customerName}} {{amount}} + preview live |
| `/accounting/dunning/letters` | جدول كل الـ letters + filters + زر `إعادة إرسال` لكل letter |
| `/accounting/customers/:id/dunning` | timeline لكل dunning history للعميل |
| Customer card | زر `تسجيل وعد بالدفع` 🟡 + form (مبلغ، تاريخ، ملاحظة) |
| Customer card (إذا creditHold) | banner أحمر `العميل محظور` + زر `رفع الحظر` (يتطلب صلاحية manager) |
| `/accounting/dunning/snooze` | اختيار عميل + عدد أيام snooze + سبب |
| `/accounting/dunning/effectiveness` | charts: collection rate per level + DSO trend |

---

# 🔴 النقص 6: Payment Runs مع SEPA/ACH/SARIE

## السبب
`src/lib/payment-run-engine.ts` يولد proposal و JE لكن **لا يولد ملف بنكي قابل للرفع** للبنك السعودي (SARIE) أو الدولي.

## البرومنت الجاهز

```
وسّع src/lib/payment-run-engine.ts + أنشئ:
- src/lib/payment-file-generators/sarie.ts (للبنوك السعودية)
- src/lib/payment-file-generators/sepa-pain001.ts (XML ISO 20022 للبنوك الأوروبية)
- src/lib/payment-file-generators/ach-nacha.ts (للبنوك الأمريكية)
- src/lib/payment-file-generators/swift-mt103.ts (للتحويلات الدولية)

المنطق:
1. PaymentRun Workflow (موسّع):
   - DRAFT → PROPOSED → APPROVED → FILE_GENERATED → SENT_TO_BANK → CONFIRMED → POSTED
   - approval workflow: مدير مالي + مدير عام (لمبالغ > 100K)
   - عند APPROVED: قفل الفواتير المختارة (lock to prevent double payment)

2. SARIE File Format (للبنك السعودي):
   - CSV/Excel format يقبله الراجحي/الأهلي/سامبا/SAB
   - أعمدة: BeneficiaryName، IBAN، Amount، Currency، PurposeCode، Reference
   - validate IBAN (SA + 22 char)
   - validate currency = SAR
   - تشفير الملف اختياري (PGP)

3. SEPA pain.001.001.09:
   - XML schema-compliant
   - GroupHeader (MsgId، CreDtTm، NbOfTxs، CtrlSum)
   - PaymentInformation (PmtInfId، PmtMtd=TRF، ReqdExctnDt، Dbtr، DbtrAcct، DbtrAgt)
   - CreditTransferTransaction (PmtId، Amt، CdtrAgt، Cdtr، CdtrAcct، RmtInf)

4. NACHA ACH (US):
   - File Header Record
   - Batch Header (Service Class Code 220 = Credit)
   - Entry Detail Records (ACH Trace Number)
   - Batch Control + File Control

5. SWIFT MT103 (International Wire):
   - :20: Sender's Reference
   - :32A: Value Date + Currency + Amount
   - :50K: Ordering Customer
   - :59: Beneficiary Customer
   - :71A: Details of Charges (OUR/SHA/BEN)

6. Bank Confirmation Upload:
   - بعد رفع الملف للبنك: المحاسب يرفع confirmation file
   - parser يفحص: ✓ نجحت، ✗ فشلت + سبب
   - update PaymentRunLine.status

7. Reconciliation:
   - الدفعات المنجزة → تظهر في Bank Statement → reconciliation تلقائية
   - الفاشلة → return للحالة OPEN + alert للمحاسب

8. Discount Optimization:
   - فاتورة بـ 2/10 Net 30: لو الدفع خلال 10 أيام → خصم 2%
   - الـ engine يقترح أولاً الفواتير اللي لها discount window فعّال
   - بعد الموافقة: يطبق الخصم في JE

9. Audit + Approval:
   - كل run يسجل: من اقترح، من وافق، متى، أي ملف
   - storage الملف على S3 مشفّر
```

## السيناريو

```
يوم الـ Payment Run الأسبوعي (كل خميس):
1. المحاسب يضغط "إنشاء payment proposal"
2. الـ engine يحضر:
   - 250 فاتورة overdue
   - 80 فاتورة في discount window (يقترحها أولاً للوفير 12,500 SAR)
   - تجميع حسب المورد (vendor) لتقليل عدد الـ transfers
3. المحاسب يراجع، يستثني 5 فواتير (مشاكل مع المورد)
4. إجمالي الـ proposal: 1.85M SAR، 245 فاتورة، 78 مورد
5. يضغط "submit for approval"
6. مدير مالي يوافق → مدير عام يوافق (لأنه > 1M)
7. يضغط "Generate Bank File":
   - 70 مورد محلي → SARIE Excel للراجحي
   - 8 موردين دولي → SWIFT MT103 (8 ملفات)
8. ينزّل الملفات + يرفعها على portal بنكه
9. بعد ساعتين: يرفع confirmation file → 243 ✓ + 2 فشل (IBAN خاطئ)
10. الـ system:
    - يولد JE للناجحة: DR AP 1.83M / CR Bank 1.83M
    - يولد JE للخصومات: DR Vendor Discount Income 12.5K
    - الـ 2 الفاشلة → ترجع OPEN + email للمحاسب
```

## تدفق البيانات

```
[Payment Run Wizard]
   ↓
Step 1: POST /api/accounting/payment-runs/propose
        { dueDateUntil, currency, vendorIds?, includeDiscountWindow }
        → returns { lines: [...], totalAmount, estimatedSavings }
   ↓
Step 2: PUT /api/accounting/payment-runs/:id/lines (exclude/include)
   ↓
Step 3: POST /api/accounting/payment-runs/:id/submit-for-approval
        → triggers approval workflow
   ↓
Step 4: (Manager) POST /api/accounting/payment-runs/:id/approve
   ↓
Step 5: POST /api/accounting/payment-runs/:id/generate-files
        { format: 'SARIE' | 'SEPA' | 'NACHA' | 'SWIFT_MT103' }
        → returns file URLs (one per format/bank)
   ↓
Step 6: (Manual) المحاسب يرفع الملفات على portals البنوك
   ↓
Step 7: POST /api/accounting/payment-runs/:id/upload-confirmation
        { file: confirmation.csv }
        → parser updates PaymentRunLine.status
   ↓
Step 8: POST /api/accounting/payment-runs/:id/post-journal
        → generates JE for successful + reverses failed
```

## Prisma Schema (إضافات)

```prisma
model PaymentRun {
  // ... existing
  status              String    @default("DRAFT")  // DRAFT | PROPOSED | PENDING_APPROVAL | APPROVED | FILE_GENERATED | SENT_TO_BANK | CONFIRMED | POSTED | FAILED
  totalAmount         Decimal   @db.Decimal(20,4)
  totalCount          Int       @default(0)
  successCount        Int       @default(0)
  failedCount         Int       @default(0)
  estimatedSavings    Decimal?  @db.Decimal(20,4)
  bankFiles           PaymentRunBankFile[]
  approvals           PaymentRunApproval[]
  proposedAt          DateTime?
  proposedByUserId    String?
  submittedForApprovalAt DateTime?
  approvedAt          DateTime?
  filesGeneratedAt    DateTime?
  sentToBankAt        DateTime?
  confirmedAt         DateTime?
  postedAt            DateTime?
  journalEntryId      Int?
  failureJournalId    Int?
}

model PaymentRunLine {
  // ... existing
  vendorId            Int
  vendor              Vendor    @relation(fields: [vendorId], references: [id])
  invoiceId           Int?
  amount              Decimal   @db.Decimal(20,4)
  currency            String
  beneficiaryName     String
  beneficiaryIBAN     String?
  beneficiarySwift    String?
  beneficiaryBankName String?
  beneficiaryCountry  String?
  paymentMethod       String    // 'BANK_TRANSFER' | 'CHECK' | 'CASH' | 'WIRE'
  discountAmount      Decimal?  @db.Decimal(20,4)
  discountTaken       Boolean   @default(false)
  status              String    // 'PENDING' | 'EXCLUDED' | 'SENT' | 'CONFIRMED' | 'FAILED' | 'RETURNED'
  failureReason       String?
  externalReference   String?
  bankConfirmedAt     DateTime?
  excludedReason      String?
  excludedByUserId    String?
  @@index([runId, status])
  @@index([vendorId])
}

model PaymentRunBankFile {
  id                  Int       @id @default(autoincrement())
  runId               Int
  run                 PaymentRun @relation(fields: [runId], references: [id])
  fileFormat          String    // 'SARIE' | 'SEPA_PAIN001' | 'NACHA' | 'SWIFT_MT103' | 'CSV_GENERIC'
  bankCode            String?   // مثل: ALRAJHI, SAB, SAMBA, NCB
  fileUrl             String
  fileHash            String    // SHA-256
  generatedAt         DateTime  @default(now())
  generatedByUserId   String
  txnCount            Int
  totalAmount         Decimal   @db.Decimal(20,4)
  currency            String
  uploadedToBankAt    DateTime?
  confirmationFileUrl String?
  confirmationParsedAt DateTime?
  successCount        Int?
  failedCount         Int?
}

model PaymentRunApproval {
  id              Int       @id @default(autoincrement())
  runId           Int
  run             PaymentRun @relation(fields: [runId], references: [id])
  approverUserId  String
  approverRole    String    // 'FINANCE_MANAGER' | 'GENERAL_MANAGER'
  level           Int
  status          String    // 'PENDING' | 'APPROVED' | 'REJECTED'
  decisionAt      DateTime?
  comments        String?
  @@index([runId, level])
}
```

## API Endpoints

```
POST   /api/accounting/payment-runs/propose
GET    /api/accounting/payment-runs/:id
PUT    /api/accounting/payment-runs/:id/lines
POST   /api/accounting/payment-runs/:id/submit-for-approval
POST   /api/accounting/payment-runs/:id/approve
POST   /api/accounting/payment-runs/:id/reject
POST   /api/accounting/payment-runs/:id/generate-files (multipart with format)
GET    /api/accounting/payment-runs/:id/files/:fileId/download
POST   /api/accounting/payment-runs/:id/mark-sent-to-bank
POST   /api/accounting/payment-runs/:id/upload-confirmation
POST   /api/accounting/payment-runs/:id/post-journal
POST   /api/accounting/payment-runs/:id/cancel
GET    /api/accounting/payment-runs/discount-opportunities  (الفواتير في discount window)
```

## أزرار UI

| الصفحة | الزر |
|--------|------|
| `/accounting/payment-runs` | جدول كل runs مع status badges + زر `إنشاء run جديد` 🟢 |
| Wizard Step 1 | فلاتر (due date, currency, vendor) + زر `جلب الاقتراحات` |
| Wizard Step 2 | جدول lines مع checkbox + زر `استبعاد المحدد` + KPIs (إجمالي، عدد، خصومات) |
| Wizard Step 3 | زر `إرسال للاعتماد` 🟦 |
| Approval Page | زر `موافق` 🟢 + زر `رفض` 🔴 + textarea للتعليق |
| Run Detail (APPROVED) | زر `توليد ملف SARIE` + `توليد ملف SEPA` + `توليد SWIFT` (حسب الموردين) |
| Run Detail (FILE_GENERATED) | زر `تنزيل الملف` لكل ملف + زر `وضع علامة "أرسل للبنك"` |
| Run Detail (SENT) | upload confirmation file → زر `معالجة الـ confirmation` |
| Run Detail (CONFIRMED) | زر `ترحيل القيد` 🔴 + معاينة JE |
| `/accounting/payment-runs/:id/lines/:lineId` | تفاصيل line + زر `إعادة محاولة` (للـ FAILED) |
| `/accounting/payment-runs/discount-opportunities` | dashboard للخصومات الممكنة + زر `إنشاء run الآن لتوفير X` |

---

# 🟠 النقص 7: Bank Statement Importer (CAMT.053 + OFX + Bank-specific)

## السبب
`src/lib/bank-statement-importer.ts` يدعم MT940 جزئياً + CSV. يفتقد:
- CAMT.053 (ISO 20022 — البنوك الأوروبية)
- OFX (QuickBooks، البنوك الأمريكية)
- صيغ بنوك سعودية محددة (الراجحي، الأهلي، سامبا)

## البرومنت الجاهز

```
أنشئ src/lib/bank-statement-parsers/:
- mt940.ts (مكتمل، يدعم كل الـ tags)
- camt053.ts (XML ISO 20022)
- ofx.ts (SGML/XML)
- alrajhi-csv.ts (تنسيق الراجحي الخاص)
- ahli-excel.ts (تنسيق الأهلي)
- samba-csv.ts
- generic-csv.ts (مع column mapping configurable)
- pdf-ocr.ts (لاستخراج من كشوف PDF عبر Gemini Vision)

المتطلبات:
1. كل parser يرجع نفس الشكل:
   {
     statementNumber,
     bankCode,
     accountNumber,
     iban,
     currency,
     openingBalance,
     openingDate,
     closingBalance,
     closingDate,
     transactions: [{
       transactionDate,
       valueDate,
       amount,
       currency,
       type: 'DEBIT' | 'CREDIT',
       description,
       reference,
       counterpartyName,
       counterpartyIBAN,
       category: 'TRANSFER' | 'FEE' | 'INTEREST' | 'CHECK' | 'CARD' | 'CASH' | 'OTHER',
       rawData: {} // الأصل
     }]
   }

2. Auto-detection:
   - parseAuto(file: Buffer, fileName: string): يحدد الصيغة تلقائياً
   - يفحص header + extension + content patterns
   - يرجع { format, parsedData }

3. Duplicate Detection:
   - hash لكل transaction (date + amount + reference + counterparty)
   - قبل الإدراج: يفحص لو موجود → يتجاوز + يبلغ
   - يحفظ duplicates في log

4. Validation:
   - opening + sum(transactions) = closing → ✓
   - إذا ≠ → reject + show difference

5. Multi-account in one file:
   - بعض البنوك ترسل ملف فيه عدة حسابات
   - parser يفصلها لـ multiple statements

6. PDF OCR (Gemini Vision):
   - رفع PDF كشف بنك
   - call Gemini مع structured prompt
   - parse response إلى نفس الشكل
   - confidence score per transaction
   - manual review للـ low-confidence

7. Bank Mapping:
   - BankAccount.bankCode لتحديد الـ parser المناسب
   - Settings.banks: { ALRAJHI: { format: 'alrajhi-csv', encoding: 'utf-8' } }
```

## السيناريو

```
سيناريو 1 - رفع كشف الراجحي:
المحاسب يضغط "استيراد كشف بنك" → يختار حسابه في الراجحي → يرفع CSV
→ parser يكتشف "alrajhi-csv" تلقائياً
→ يقرأ 1,250 معاملة
→ يكتشف 50 منها مكررة (مرفوعة سابقاً) → يتجاوز
→ يستورد 1,200 معاملة جديدة
→ opening + transactions = closing ✓
→ يحفظ BankStatement + 1,200 BankStatementLine
→ تنبيه: "تم استيراد 1,200 معاملة، 50 مكررة، رصيد متطابق ✓"

سيناريو 2 - PDF OCR:
البنك يرسل PDF (لا CSV) → المحاسب يرفعه
→ Gemini Vision يقرأ → يستخرج 85 معاملة
→ 80 confidence > 90% → استيراد مباشر
→ 5 confidence < 90% → manual review screen
→ المحاسب يصحّح/يؤكد → يستورد

سيناريو 3 - Multi-account file:
البنك يرسل XML CAMT.053 يحوي 3 حسابات
→ parser يفصل 3 statements → يستورد كل واحد للحساب المناسب
```

## تدفق البيانات

```
[Bank Statement Upload UI]
   ↓
POST /api/banks/statements/upload (multipart file + bankAccountId)
   ↓
   parseAuto(file) → detect format
   ↓
   for each statement:
     - validate balances
     - detect duplicates (hash check)
     - create BankStatement + BankStatementLines
     - mark high-confidence as auto-matched (later by recon engine)
   ↓
   return { statementsCreated, transactionsCreated, duplicatesSkipped, lowConfidenceCount }
   ↓
[Auto-trigger] → Bank Reconciliation Engine.matchStatement(statementId)
   ↓
   matched → create JE
   unmatched → exception queue
```

## Prisma Schema (إضافات)

```prisma
model BankStatement {
  // ... existing
  fileFormat        String?   // 'MT940' | 'CAMT053' | 'OFX' | 'CSV' | 'PDF_OCR' | etc.
  fileUrl           String?
  fileHash          String?
  importedByUserId  String?
  importMethod      String    @default("MANUAL")  // 'MANUAL' | 'API' | 'OCR'
  validationStatus  String    @default("PENDING")  // PENDING | VALID | BALANCE_MISMATCH
  duplicatesCount   Int       @default(0)
  lowConfidenceCount Int      @default(0)
}

model BankStatementLine {
  // ... existing
  category          String?   // 'TRANSFER' | 'FEE' | 'INTEREST' | 'CHECK' | 'CARD' | 'CASH'
  counterpartyName  String?
  counterpartyIBAN  String?
  counterpartyBank  String?
  ocrConfidence     Decimal?  @db.Decimal(5,2)
  isDuplicate       Boolean   @default(false)
  duplicateOfLineId Int?
  rawData           Json?
  hash              String    // for duplicate detection
  matchStatus       String    @default("UNMATCHED")  // UNMATCHED | AUTO_MATCHED | MANUAL_MATCHED | EXCEPTION
  matchedToType     String?   // 'JE' | 'PAYMENT' | 'CHECK'
  matchedToId       Int?
  matchedAt         DateTime?
  matchedByUserId   String?
  @@index([hash])
  @@index([matchStatus])
}

model BankAccount {
  // ... existing
  bankCode          String?   // 'ALRAJHI' | 'NCB' | 'SAB' | 'SAMBA' | etc.
  preferredFileFormat String?
  fileEncoding      String    @default("utf-8")
  fileColumnMapping Json?     // for generic-csv
}
```

## API Endpoints

```
POST   /api/banks/statements/upload
POST   /api/banks/statements/upload-pdf-ocr
GET    /api/banks/statements?bankAccountId&dateFrom&dateTo
GET    /api/banks/statements/:id
GET    /api/banks/statements/:id/lines
POST   /api/banks/statements/:id/validate
DELETE /api/banks/statements/:id  (only if no JEs created)
GET    /api/banks/statements/:id/low-confidence
PUT    /api/banks/statements/lines/:id/correct
GET    /api/banks/statements/duplicates
```

## أزرار UI

| الصفحة | الزر |
|--------|------|
| `/banks/statements` | جدول كل الكشوف + زر `استيراد كشف جديد` 🟢 |
| Modal الاستيراد | اختيار حساب بنكي + drag-drop file + auto-detect format hint |
| نتيجة الاستيراد | summary card (X استيراد، Y مكرر، Z low-confidence) + زر `مراجعة Low-Confidence` |
| `/banks/statements/:id/review` | جدول معاملات low-confidence + قبول/رفض/تصحيح لكل واحدة |
| `/banks/statements/:id` | جدول كل المعاملات مع badges (matched/exception) + زر `تشغيل المطابقة` |
| `/banks/account-settings/:id` | تكوين format المفضل + column mapping (لو CSV) |

---

# 🟠 النقص 8: Bank Reconciliation Exception Queue + Fuzzy Matching

## السبب
الـ engine الحالي يطابق exact-match فقط. يفتقد: fuzzy matching بـ AI، exception queue، confidence scoring، rule learning.

## البرومنت الجاهز

```
وسّع src/lib/bank-recon-engine.ts:

1. Multi-strategy Matching:
   - Strategy 1 - Exact: amount + date (±1 day) + reference
   - Strategy 2 - Fuzzy reference: amount + date + Levenshtein distance < 3 على reference
   - Strategy 3 - Counterparty + amount: counterparty IBAN + amount (للتحويلات بدون reference)
   - Strategy 4 - Aggregate: مجموع عدة فواتير = transaction واحدة
   - Strategy 5 - Split: transaction واحدة = عدة دفعات
   - Strategy 6 - AI assisted: Gemini يقترح مطابقات للحالات الصعبة

2. Confidence Scoring (0-100):
   - Exact: 100
   - Fuzzy reference: 70-95
   - Counterparty match: 60-85
   - AI suggested: حسب Gemini response

3. Auto-match Threshold:
   - Settings.bankRecon.autoMatchThreshold (default 90)
   - confidence >= threshold → auto match
   - else → exception queue

4. Exception Queue:
   - شاشة لكل المعاملات unmatched
   - filters: amount range, date range, account
   - actions: manual match / create new JE / mark as bank fee / dismiss

5. Rule Learning:
   - عند manual match: يحفظ pattern (e.g., "اسم تتضمن BANK_FEE → حساب مصاريف بنكية")
   - الـ rule تطبق تلقائياً على معاملات جديدة مماثلة
   - rule confidence يتزايد مع الاستخدام الناجح

6. Common Recon Items:
   - Bank charges (auto-create JE: DR Bank Fees / CR Bank)
   - Interest received
   - Returned checks (NSF)
   - Standing orders / direct debits
   - FX adjustments

7. Multi-period Recon:
   - Outstanding checks: شيكات صدرت ولم تظهر في الكشف
   - Deposits in transit: إيداعات لم تصل البنك بعد
   - تقرير: Book balance vs Bank balance + reconciling items

8. Recon Sign-off:
   - عند انتهاء reconciliation للشهر: زر "إغلاق المطابقة"
   - يولد PDF: Bank Reconciliation Statement
   - يقفل reconciled transactions (لا يمكن تعديل)
   - workflow approval (محاسب → مدير مالي)
```

## السيناريو

```
سيناريو يومي:
1. كشف البنك يحتوي 200 معاملة جديدة
2. الـ engine يطبق strategies:
   - 130 → exact match (confidence 100)
   - 35 → fuzzy match (confidence 90+) → auto
   - 20 → AI suggested (confidence 75-89) → exception queue للمراجعة
   - 15 → unmatched (confidence < 75)
3. المحاسب يفتح exception queue:
   - 20 AI-suggested: يراجع، يقبل 18، يعدل 2
   - 15 unmatched:
     - 8 معاملات bank fee → يضغط "إنشاء JE bank fee"
     - 4 معاملات لـ موردين جدد → يربطها بـ Vendor
     - 3 معاملات غير معروفة → يحول لمدير

4. نهاية الشهر:
   - 580 معاملة، 575 matched
   - 5 outstanding (شيكات لم تصرف بعد)
   - المحاسب يضغط "إغلاق مطابقة الشهر"
   - يولد PDF + يرسل للمدير للاعتماد
```

## تدفق البيانات

```
[Statement Imported] → Auto-trigger
   ↓
ReconEngine.matchStatement(statementId)
   ↓
   for each unmatched line:
     try Strategy 1 (exact) → if match → save with confidence 100
     else try Strategy 2 (fuzzy) → if confidence >= threshold → save
     else try Strategy 3 (counterparty) → ...
     else try Strategy 4 (aggregate) → ...
     else try Strategy 5 (split) → ...
     else try Strategy 6 (AI Gemini) → save to queue with AI suggestion
   ↓
   apply learned rules → create JEs for known patterns
   ↓
   summary: { autoMatched, queued, unmatched }

[Exception Queue UI]
   ↓
   GET /api/banks/recon/exceptions?bankAccountId
   ↓
   for each exception:
     - manual match → POST /api/banks/recon/match { lineId, targetType, targetId }
     - create JE → POST /api/banks/recon/create-je { lineId, accountId, description }
     - dismiss → POST /api/banks/recon/dismiss { lineId, reason }
   ↓
[Sign-off]
   ↓
POST /api/banks/recon/close-period { bankAccountId, periodEnd }
   ↓
   validate: kein unmatched > tolerance
   ↓
   generate PDF
   ↓
   workflow approval
```

## Prisma Schema (إضافات)

```prisma
model BankReconciliation {
  id                Int       @id @default(autoincrement())
  bankAccountId     Int
  bankAccount       BankAccount @relation(fields: [bankAccountId], references: [id])
  periodStart       DateTime
  periodEnd         DateTime
  bookBalance       Decimal   @db.Decimal(20,4)
  bankBalance       Decimal   @db.Decimal(20,4)
  reconcilingItems  Json      // outstanding checks, deposits in transit
  difference        Decimal   @db.Decimal(20,4)
  status            String    @default("DRAFT")  // DRAFT | PENDING_APPROVAL | APPROVED | LOCKED
  pdfUrl            String?
  createdByUserId   String
  approvedByUserId  String?
  approvedAt        DateTime?
  closedAt          DateTime?
  @@unique([bankAccountId, periodEnd])
}

model BankReconRule {
  id                Int       @id @default(autoincrement())
  name              String
  bankAccountId     Int?      // null = all accounts
  conditions        Json      // [{field: 'description', operator: 'contains', value: 'BANK FEE'}]
  action            String    // 'CREATE_JE' | 'MATCH_TO_VENDOR' | 'MATCH_TO_CUSTOMER'
  actionParams      Json      // {accountId: 5050, description: 'Bank Fee'}
  successCount      Int       @default(0)
  failureCount      Int       @default(0)
  enabled           Boolean   @default(true)
  learnedFromLineId Int?
  createdByUserId   String?
  createdAt         DateTime  @default(now())
  @@index([bankAccountId, enabled])
}

model BankStatementLine {
  // ... existing
  matchConfidence   Decimal?  @db.Decimal(5,2)
  matchStrategy     String?   // 'EXACT' | 'FUZZY' | 'COUNTERPARTY' | 'AGGREGATE' | 'AI'
  aiSuggestion      Json?
  matchedJournalId  Int?
  reconciliationId  Int?
  reconciliation    BankReconciliation? @relation(fields: [reconciliationId], references: [id])
}
```

## API Endpoints

```
POST   /api/banks/recon/match-statement       (run engine on new statement)
GET    /api/banks/recon/exceptions
POST   /api/banks/recon/match                 (manual match)
POST   /api/banks/recon/create-je             (from exception)
POST   /api/banks/recon/dismiss
POST   /api/banks/recon/learn-rule            (from manual match)
GET    /api/banks/recon/rules
PUT    /api/banks/recon/rules/:id
DELETE /api/banks/recon/rules/:id
POST   /api/banks/recon/close-period
POST   /api/banks/recon/:id/approve
GET    /api/banks/recon/:id/pdf
GET    /api/banks/recon/outstanding-checks?bankAccountId
GET    /api/banks/recon/deposits-in-transit
```

## أزرار UI

| الصفحة | الزر |
|--------|------|
| `/banks/recon/dashboard` | KPIs (matched %, exceptions count, outstanding) |
| `/banks/recon/exceptions` | جدول exceptions + filters + bulk actions |
| كل صف exception | زر `مطابقة يدوية` 🟦 + زر `إنشاء قيد` 🟢 + زر `تجاهل` ⬜ |
| Modal Manual Match | جدول candidates (JEs/Payments/Checks) مرتبة حسب likelihood + checkbox |
| Modal Create JE | حقل account + description + amount (auto from line) + زر `حفظ القيد` |
| Modal Create Rule | "هل تريد تطبيق هذا تلقائياً للمعاملات المماثلة؟" → form للـ rule |
| `/banks/recon/rules` | CRUD للقواعد + إحصائيات (success/failure) لكل قاعدة |
| `/banks/recon/close-period` | wizard: مراجعة exceptions → review reconciling items → preview PDF → submit |
| `/banks/recon/closed-periods` | جدول الفترات المغلقة + زر `تنزيل PDF` لكل فترة |

---

# 🟠 النقص 9: Multi-Book / Multi-GAAP Activation

## السبب
`src/lib/multi-book-engine.ts` لديه schema للـ AccountingBook لكن **mapping rules غير مفعّلة**. النظام يعمل بـ book واحد فقط.

## البرومنت الجاهز

```
فعّل Multi-Book Accounting في src/lib/multi-book-engine.ts:

1. Concept:
   - Primary Book (PB) = SOCPA / IFRS
   - Secondary Books: Tax (Zakat)، Management (المديرية)، Group (لـ consolidation)
   - كل JE يُرحّل لكل book مع mapping قابل للتعديل
   - تقارير منفصلة لكل book

2. Account Mapping:
   - AccountMapping: { sourceAccountId, bookId, targetAccountId, transformRule }
   - مثال: حساب "Goodwill" في IFRS book يُمر، لكن في Tax book يذهب لـ "Non-deductible Asset"
   - transformRule: { type: 'PASS' | 'AMOUNT_PCT' | 'EXCLUDE', params: {} }

3. Posting Engine:
   - عند ترحيل JE: 
     - رحّل في PB (الأساسي)
     - لكل secondary book: تحقق من mapping → رحّل النسخة المعدّلة
   - حقل JournalEntry.bookId للتمييز

4. Book-Specific JE:
   - بعض القيود لا تظهر إلا في book واحد (e.g., book-only تعديلات Tax)
   - أضف حقل JE.bookOnly = bookId

5. Reports per Book:
   - Trial Balance per book
   - P&L per book
   - Balance Sheet per book
   - Reconciliation report بين books (الفروقات)

6. Currency per Book:
   - PB = SAR
   - Group book = USD (مع translation)

7. Use Cases:
   - شركة سعودية + شركة أم أمريكية: PB=IFRS-SAR، GroupBook=GAAP-USD
   - Tax adjustments (entertainment expenses 50% deductible) → Tax book مختلف
   - Management book مع internal allocations مختلفة

8. UI:
   - Book switcher في كل تقرير
   - Mapping editor (visual)
   - Book reconciliation report
```

## السيناريو

```
شركة سعودية لها شركة أم في أمريكا:
- PB (IFRS-SAR): كل القيود الأساسية
- TaxBook (Zakat-SAR): تعديلات للزكاة (مثلاً entertainment غير مقبول)
- GroupBook (US-GAAP-USD): للـ consolidation عند الأم

مثال:
JE في PB:
  DR Entertainment Expense 10,000 SAR
  CR Cash 10,000 SAR

→ AccountMapping (TaxBook): Entertainment → Non-Deductible (50% فقط)
→ JE في TaxBook (تلقائي):
  DR Allowable Entertainment 5,000 SAR
  DR Non-Deductible Expense 5,000 SAR
  CR Cash 10,000 SAR

→ AccountMapping (GroupBook): SAR → USD @ daily rate
→ JE في GroupBook:
  DR Entertainment Expense 2,667 USD
  CR Cash 2,667 USD

تقارير:
- Trial Balance (PB) → SAR
- Trial Balance (TaxBook) → SAR مع التعديلات
- Trial Balance (GroupBook) → USD
- Reconciliation: PB vs TaxBook (يوضح الفروقات)
```

## تدفق البيانات

```
[JE Posted in PB]
   ↓
MultiBookEngine.replicateToSecondaryBooks(jeId)
   ↓
   for each active secondary book:
     - getMappings(bookId)
     - for each line in source JE:
       - findMapping(line.accountId, bookId)
       - if EXCLUDE → skip
       - if PASS → copy line as-is
       - if AMOUNT_PCT → adjust amount per rule
       - if SPLIT → create multiple lines
     - validate balanced
     - create new JE with bookId set
   ↓
   link via JournalEntry.replicatedFromId

[Reports]
   ↓
GET /api/accounting/reports/trial-balance?bookId=X
   ↓
   filter JEs WHERE bookId = X
   ↓
   compute balances + return
```

## Prisma Schema (إضافات)

```prisma
model AccountingBook {
  // ... existing
  type              String    // 'PRIMARY' | 'TAX' | 'MANAGEMENT' | 'GROUP' | 'STATUTORY'
  gaapStandard      String    // 'IFRS' | 'SOCPA' | 'US_GAAP' | 'ZAKAT' | 'CUSTOM'
  baseCurrency      String    @default("SAR")
  isPrimary         Boolean   @default(false)
  active            Boolean   @default(true)
  mappings          AccountMapping[]
  journalEntries    JournalEntry[]
}

model AccountMapping {
  id                Int       @id @default(autoincrement())
  bookId            Int
  book              AccountingBook @relation(fields: [bookId], references: [id])
  sourceAccountId   Int
  sourceAccount     Account   @relation("MappingSource", fields: [sourceAccountId], references: [id])
  targetAccountId   Int?
  targetAccount     Account?  @relation("MappingTarget", fields: [targetAccountId], references: [id])
  rule              String    // 'PASS' | 'EXCLUDE' | 'AMOUNT_PCT' | 'SPLIT' | 'CUSTOM_FORMULA'
  ruleParams        Json?     // {pct: 50, splitTo: [{accountId, pct}]}
  effectiveFrom     DateTime  @default(now())
  effectiveTo       DateTime?
  notes             String?
  @@unique([bookId, sourceAccountId, effectiveFrom])
}

model JournalEntry {
  // ... existing
  bookId            Int       @default(1)  // PB by default
  book              AccountingBook @relation(fields: [bookId], references: [id])
  replicatedFromId  Int?      // الأصل في PB
  replicatedFrom    JournalEntry? @relation("Replications", fields: [replicatedFromId], references: [id])
  replications      JournalEntry[] @relation("Replications")
  bookOnly          Boolean   @default(false)
  fxRateUsed        Decimal?  @db.Decimal(20,8)
}

model BookReconciliation {
  id                Int       @id @default(autoincrement())
  bookAId           Int
  bookBId           Int
  asOfDate          DateTime
  differences       Json      // [{accountCode, bookA: 1000, bookB: 1200, diff: 200, reason}]
  generatedAt       DateTime  @default(now())
  generatedByUserId String
}
```

## API Endpoints

```
GET    /api/accounting/books
POST   /api/accounting/books
PUT    /api/accounting/books/:id
GET    /api/accounting/books/:id/mappings
POST   /api/accounting/books/:id/mappings
PUT    /api/accounting/books/:id/mappings/:mappingId
DELETE /api/accounting/books/:id/mappings/:mappingId
POST   /api/accounting/books/:id/replicate-from-primary  (back-fill)
GET    /api/accounting/books/:id/journal-entries
GET    /api/accounting/books/reconciliation?bookA&bookB&asOfDate
GET    /api/accounting/reports/trial-balance?bookId
GET    /api/accounting/reports/income-statement?bookId
GET    /api/accounting/reports/balance-sheet?bookId
```

## أزرار UI

| الصفحة | الزر |
|--------|------|
| `/accounting/books` | جدول الـ books + زر `إنشاء book جديد` 🟢 |
| Book Form | name, type, gaap, currency, isPrimary toggle |
| `/accounting/books/:id/mappings` | جدول mappings + زر `إضافة mapping` |
| Mapping Editor | source account dropdown + target + rule (radio: PASS/EXCLUDE/AMOUNT_PCT/SPLIT) + ruleParams |
| كل تقرير | dropdown `Book` في top-right (PB/Tax/Management/Group) |
| `/accounting/books/reconciliation` | فورم: bookA, bookB, date → button `قارن` → table differences |
| `/accounting/books/:id/replicate-from-primary` | زر `أعد التوليد من PB` (لو بدأت multi-book بعد قيود) |

---

# 🟠 النقص 10: Revenue Recognition JE Posting (IFRS 15 / ASC 606)

## السبب
`src/lib/revenue-recognition.ts` ينشئ DeferredRevenueSchedule لكن **JE generation = TODO**. الإيراد لا يُعترف به فعلياً.

## البرومنت الجاهز

```
أكمل src/lib/revenue-recognition.ts:

1. Performance Obligation Identification (5-step model):
   - Step 1: Identify contract with customer
   - Step 2: Identify performance obligations (POs)
   - Step 3: Determine transaction price
   - Step 4: Allocate price to POs (based on standalone selling price - SSP)
   - Step 5: Recognize revenue when (or as) PO is satisfied

2. Recognition Patterns:
   - POINT_IN_TIME (delivery, completion)
   - OVER_TIME_STRAIGHT_LINE (subscription)
   - OVER_TIME_USAGE_BASED (units delivered)
   - OVER_TIME_PERCENT_COMPLETION (construction contracts)
   - MILESTONE (project deliverables)

3. Schedule Generation:
   - عند إصدار فاتورة: لو لها performance obligations
     - أنشئ DeferredRevenueSchedule
     - قسّم على فترات (شهور)
     - JE الفاتورة:
       DR Customer 1,200 / CR Deferred Revenue 1,200

4. Monthly Recognition Job (Cron):
   - يجلب كل schedules.lines المستحقة هذا الشهر
   - لكل line:
     JE: DR Deferred Revenue X / CR Revenue X
   - يحدّث line.recognizedAt + amountRecognized

5. Contract Modifications:
   - إضافة scope جديد بسعر منفصل → contract جديد
   - تغيير سعر فقط → cumulative catch-up
   - تغيير scope بدون سعر مستقل → restated future periods

6. Variable Consideration:
   - bonuses, penalties, refunds
   - estimate using Expected Value or Most Likely Amount
   - constrained by likelihood threshold

7. Refund Liabilities:
   - إذا متوقع returns 5%: حجز 5% كـ refund liability

8. Right of Return:
   - تسجيل asset (right to recover) + liability (refund)

9. Reports:
   - Deferred Revenue Roll-forward
   - Revenue Recognition Schedule
   - Backlog (مستقبلية)
   - ASC 606 Disclosures table
```

## السيناريو

```
سيناريو 1 - Subscription:
بيع اشتراك سنوي 12,000 SAR، يبدأ 1/1/2026
→ فاتورة + JE:
  DR Customer 12,000
  CR Deferred Revenue 12,000

→ Schedule (12 سطر، 1,000/شهر):
  31/1/2026 - 1,000
  28/2/2026 - 1,000
  ...
  31/12/2026 - 1,000

→ Cron شهري في 1/2/2026:
  JE: DR Deferred Revenue 1,000 / CR Revenue 1,000

سيناريو 2 - Multi-PO:
عقد بـ 100,000 يحتوي:
- Software License (PO1) - SSP 60,000 (point-in-time)
- 1-year Support (PO2) - SSP 24,000 (over-time)
- Implementation (PO3) - SSP 16,000 (milestone)
→ Allocation:
  PO1: 60% × 100,000 = 60,000
  PO2: 24% × 100,000 = 24,000
  PO3: 16% × 100,000 = 16,000

→ عند توقيع العقد:
  DR Customer 100,000 / CR Contract Liability 100,000

→ عند تسليم License (PO1):
  DR Contract Liability 60,000 / CR Revenue 60,000

→ خلال السنة (PO2 شهرياً):
  DR Contract Liability 2,000 / CR Revenue 2,000

→ عند milestone implementation:
  DR Contract Liability 16,000 / CR Revenue 16,000

سيناريو 3 - Modification:
بعد 6 شهور من الـ subscription، العميل يضيف مستخدمين بـ 6,000 إضافية
→ contract جديد منفصل (لأن السعر standalone)
→ schedule جديد لـ 6 شهور المتبقية
```

## تدفق البيانات

```
[Sales Invoice with PO Components]
   ↓
POST /api/sales/invoices (with performanceObligations array)
   ↓
   for each PO:
     calculate allocation (SSP-based)
     create PerformanceObligation
     if pattern = OVER_TIME → create DeferredRevenueSchedule + lines
   ↓
   create JE (deferred revenue):
     DR Customer (total)
     CR Deferred Revenue (each PO amount)

[Monthly Cron - 1st of month]
   ↓
RecognitionEngine.runMonthly()
   ↓
   getDeferredLines WHERE recognitionDate <= today AND recognizedAt IS NULL
   ↓
   group by performanceObligation
   ↓
   for each:
     create JE: DR Deferred Revenue / CR Revenue
     update lines.recognizedAt
   ↓
   summary report

[PO Completion - Point in time]
   ↓
POST /api/sales/po/:id/mark-completed
   ↓
   create JE: DR Deferred Revenue (full PO) / CR Revenue (full PO)
   ↓
   update PO.completedAt + PO.completionMethod
```

## Prisma Schema (إضافات)

```prisma
model SalesContract {
  id                  Int       @id @default(autoincrement())
  contractNumber      String    @unique
  customerId          Int
  customer            Customer  @relation(fields: [customerId], references: [id])
  startDate           DateTime
  endDate             DateTime?
  totalContractValue  Decimal   @db.Decimal(20,4)
  currency            String
  status              String    @default("ACTIVE")  // ACTIVE | COMPLETED | CANCELLED | MODIFIED
  performanceObligations PerformanceObligation[]
  modifications       ContractModification[]
  variableConsideration Json?
  createdAt           DateTime  @default(now())
}

model PerformanceObligation {
  id                  Int       @id @default(autoincrement())
  contractId          Int
  contract            SalesContract @relation(fields: [contractId], references: [id])
  description         String
  standaloneSellingPrice Decimal @db.Decimal(20,4)
  allocatedAmount     Decimal   @db.Decimal(20,4)
  recognitionPattern  String    // POINT_IN_TIME | OVER_TIME_STRAIGHT_LINE | OVER_TIME_USAGE | OVER_TIME_PCT_COMPLETION | MILESTONE
  startDate           DateTime?
  endDate             DateTime?
  expectedCompletionDate DateTime?
  completedAt         DateTime?
  completionMethod    String?
  recognizedAmount    Decimal   @default(0) @db.Decimal(20,4)
  schedule            DeferredRevenueSchedule?
}

model DeferredRevenueSchedule {
  id                  Int       @id @default(autoincrement())
  performanceObligationId Int   @unique
  performanceObligation PerformanceObligation @relation(fields: [performanceObligationId], references: [id])
  totalAmount         Decimal   @db.Decimal(20,4)
  recognitionStartDate DateTime
  recognitionEndDate  DateTime
  frequency           String    // 'DAILY' | 'MONTHLY' | 'QUARTERLY' | 'CUSTOM'
  lines               RevenueRecognitionLine[]
}

model RevenueRecognitionLine {
  // ... existing
  scheduleId          Int
  schedule            DeferredRevenueSchedule @relation(fields: [scheduleId], references: [id])
  recognitionDate     DateTime
  scheduledAmount     Decimal   @db.Decimal(20,4)
  recognizedAmount    Decimal?  @db.Decimal(20,4)
  recognizedAt        DateTime?
  journalEntryId      Int?
  status              String    @default("PENDING")  // PENDING | RECOGNIZED | ADJUSTED | CANCELLED
  @@index([scheduleId, recognitionDate])
  @@index([recognizedAt])
}

model ContractModification {
  id                  Int       @id @default(autoincrement())
  contractId          Int
  contract            SalesContract @relation(fields: [contractId], references: [id])
  modificationType    String    // 'NEW_CONTRACT' | 'CUMULATIVE_CATCH_UP' | 'PROSPECTIVE'
  modificationDate    DateTime
  changeInScope       String?
  changeInPrice       Decimal?  @db.Decimal(20,4)
  catchUpJournalId    Int?
  description         String?
  createdByUserId     String
}
```

## API Endpoints

```
POST   /api/sales/contracts
GET    /api/sales/contracts/:id
POST   /api/sales/contracts/:id/performance-obligations
PUT    /api/sales/po/:id
POST   /api/sales/po/:id/mark-completed
POST   /api/sales/contracts/:id/modify
POST   /api/accounting/revenue-recognition/run-monthly  (cron)
POST   /api/accounting/revenue-recognition/run-for-po
GET    /api/accounting/revenue-recognition/schedule/:scheduleId
GET    /api/accounting/revenue-recognition/deferred-rollforward?asOfDate
GET    /api/accounting/revenue-recognition/backlog
GET    /api/accounting/revenue-recognition/asc606-disclosures?periodStart&periodEnd
```

## أزرار UI

| الصفحة | الزر |
|--------|------|
| `/sales/contracts` | جدول العقود + زر `عقد جديد` 🟢 |
| Contract Form | فورم متعدد الخطوات: customer → POs → allocation → review |
| `/sales/contracts/:id` | tabs: Details / POs / Schedule / Modifications / Journal Entries |
| PO Card | progress bar (% recognized) + زر `إكمال الـ PO` (point-in-time) |
| `/accounting/revenue-recognition/dashboard` | KPIs: deferred revenue، monthly recognition، backlog |
| `/accounting/revenue-recognition/schedules` | جدول schedules + زر `تشغيل recognition الشهري` |
| `/accounting/revenue-recognition/deferred-rollforward` | تقرير + زر تصدير Excel |
| Modification Modal | radio: New Contract / Catch-up / Prospective + form |

---

# 🟠 النقص 11: Lease Accounting JE Posting (IFRS 16 / ASC 842)

## السبب
`src/lib/lease-accounting-engine.ts` يحسب جدول استهلاك ROU بدقة لكن **JE posting = TODO**. الـ lease غير منعكس في القيود.

## البرومنت الجاهز

```
أكمل src/lib/lease-accounting-engine.ts:

1. Initial Recognition (عند بدء العقد):
   JE:
     DR Right-of-Use Asset (ROU)     [PV of payments + initial direct costs]
     CR Lease Liability               [PV of payments]
     CR Cash                          [initial direct costs paid]
     CR Lease Incentive Liability     [if any]
   
   - حساب PV: ∑(payment / (1+r)^n) باستخدام IBR
   - تخزين schedule كامل (ROU depreciation + interest + principal + balance)

2. Monthly Recognition (Cron):
   - Interest expense: opening_liability × monthly_rate
     JE: DR Interest Expense / CR Lease Liability
   - Principal payment:
     JE: DR Lease Liability / CR Cash
   - ROU Depreciation (straight-line over lease term):
     JE: DR Depreciation Expense / CR Accumulated Depreciation - ROU

3. Lease Modification:
   - extension/reduction in term
   - change in payment amount
   - re-measure liability + adjust ROU
   - JE remeasurement:
     DR/CR ROU Asset
     DR/CR Lease Liability
   - update schedule

4. Lease Termination (early):
   - calculate termination penalty
   - reverse remaining ROU + Liability
   - JE:
     DR Lease Liability (remaining)
     CR ROU Asset (remaining net)
     DR/CR Gain/Loss on Termination

5. Sublease Accounting:
   - Operating sublease: original lease unchanged + sublease income
   - Finance sublease: derecognize ROU + recognize Net Investment in Sublease

6. Variable Lease Payments:
   - based on usage/index → expense as incurred (not in liability)
   - based on rate → reassess at index changes

7. Short-term + Low-value Exemptions:
   - lease term <= 12 months: expense as paid
   - underlying asset value < $5,000: expense as paid

8. Disclosures:
   - Lease maturity analysis (1yr, 2-5yr, >5yr)
   - Total cash outflows
   - ROU asset by class
   - Variable lease payments
```

## السيناريو

```
عقد إيجار مكتب 5 سنوات:
- إيجار شهري 10,000 SAR
- IBR (incremental borrowing rate) = 6% سنوي
- بدء 1/1/2026
- initial direct costs (commission) = 5,000 paid

PV calculation:
  60 شهر × 10,000 @ 0.5%/شهر
  PV ≈ 517,255 SAR

Initial JE (1/1/2026):
  DR ROU Asset                 522,255  (517,255 + 5,000)
  CR Lease Liability           517,255
  CR Cash                        5,000

Monthly Schedule (شهر 1):
- Opening Liability: 517,255
- Interest (0.5%): 2,586
- Payment: 10,000
- Principal: 7,414
- Closing Liability: 509,841
- ROU Depreciation: 522,255 / 60 = 8,704

Monthly JE (31/1/2026):
  DR Interest Expense              2,586
  CR Lease Liability               2,586
  
  DR Lease Liability              10,000
  CR Cash                         10,000
  
  DR Depreciation Expense          8,704
  CR Accumulated Depreciation - ROU 8,704

P&L impact شهرياً: 11,290 (interest 2,586 + depreciation 8,704)
Cash outflow: 10,000

Modification (بعد 24 شهر، تخفيض الإيجار لـ 8,000):
- recalculate PV of remaining 36 payments @ 8,000 = 263,000
- old liability balance: 320,000
- decrease 57,000 → DR Liability / CR ROU 57,000
- update schedule for remaining months
```

## تدفق البيانات

```
[Lease Contract Created]
   ↓
POST /api/accounting/leases
   ↓
   calculate PV using IBR
   ↓
   create LeaseContract + LeaseSchedule + lines
   ↓
   create initial JE (ROU + Liability)
   ↓
   schedule cron for monthly recognition

[Cron - 1st of month]
   ↓
LeaseEngine.runMonthly()
   ↓
   for each active lease:
     - get current month line
     - create 3 JEs (interest + payment + depreciation)
     - update line.recognizedAt + line.journalEntryIds
   ↓
   summary report

[Modification]
   ↓
POST /api/accounting/leases/:id/modify
   { newPaymentAmount?, newEndDate?, modificationDate, reason }
   ↓
   recalculate PV of remaining payments
   ↓
   compare with current liability
   ↓
   create remeasurement JE
   ↓
   regenerate schedule for remaining periods
```

## Prisma Schema (إضافات)

```prisma
model LeaseContract {
  // ... existing
  lessor              String
  leaseClass          String    // 'PROPERTY' | 'VEHICLE' | 'EQUIPMENT' | 'OTHER'
  startDate           DateTime
  endDate             DateTime
  paymentAmount       Decimal   @db.Decimal(20,4)
  paymentFrequency    String    @default("MONTHLY")  // MONTHLY | QUARTERLY | ANNUAL
  paymentTiming       String    @default("END")  // BEGIN (annuity due) | END (ordinary)
  currency            String    @default("SAR")
  ibr                 Decimal   @db.Decimal(8,4)  // annual rate %
  initialDirectCosts  Decimal   @default(0) @db.Decimal(20,4)
  leaseIncentive      Decimal   @default(0) @db.Decimal(20,4)
  exemption           String?   // 'SHORT_TERM' | 'LOW_VALUE' | null
  rouAccountId        Int
  liabilityAccountId  Int
  interestAccountId   Int
  depreciationAccountId Int
  accumDepreciationAccountId Int
  cashAccountId       Int
  pvOfPayments        Decimal?  @db.Decimal(20,4)
  rouAssetValue       Decimal?  @db.Decimal(20,4)
  liabilityValue      Decimal?  @db.Decimal(20,4)
  status              String    @default("ACTIVE")  // ACTIVE | TERMINATED | EXPIRED | MODIFIED
  initialJournalId    Int?
  schedule            LeaseSchedule?
  modifications       LeaseModification[]
}

model LeaseSchedule {
  id                  Int       @id @default(autoincrement())
  contractId          Int       @unique
  contract            LeaseContract @relation(fields: [contractId], references: [id])
  lines               LeaseScheduleLine[]
  generatedAt         DateTime  @default(now())
  isCurrent           Boolean   @default(true)
}

model LeaseScheduleLine {
  id                  Int       @id @default(autoincrement())
  scheduleId          Int
  schedule            LeaseSchedule @relation(fields: [scheduleId], references: [id])
  periodNumber        Int
  periodDate          DateTime
  openingLiability    Decimal   @db.Decimal(20,4)
  interestExpense     Decimal   @db.Decimal(20,4)
  payment             Decimal   @db.Decimal(20,4)
  principal           Decimal   @db.Decimal(20,4)
  closingLiability    Decimal   @db.Decimal(20,4)
  rouDepreciation     Decimal   @db.Decimal(20,4)
  rouNetBookValue     Decimal   @db.Decimal(20,4)
  recognizedAt        DateTime?
  interestJournalId   Int?
  paymentJournalId    Int?
  depreciationJournalId Int?
  @@index([scheduleId, periodNumber])
  @@index([recognizedAt])
}

model LeaseModification {
  id                  Int       @id @default(autoincrement())
  contractId          Int
  contract            LeaseContract @relation(fields: [contractId], references: [id])
  modificationDate    DateTime
  modificationType    String    // 'TERM_EXTENSION' | 'TERM_REDUCTION' | 'PAYMENT_CHANGE' | 'TERMINATION' | 'SCOPE_CHANGE'
  oldPayment          Decimal?  @db.Decimal(20,4)
  newPayment          Decimal?  @db.Decimal(20,4)
  oldEndDate          DateTime?
  newEndDate          DateTime?
  remeasurementJournalId Int?
  rouAdjustment       Decimal?  @db.Decimal(20,4)
  liabilityAdjustment Decimal?  @db.Decimal(20,4)
  notes               String?
  createdByUserId     String
}
```

## API Endpoints

```
POST   /api/accounting/leases
GET    /api/accounting/leases
GET    /api/accounting/leases/:id
GET    /api/accounting/leases/:id/schedule
POST   /api/accounting/leases/:id/calculate-pv  (preview)
POST   /api/accounting/leases/:id/post-initial  (creates initial JE)
POST   /api/accounting/leases/run-monthly  (cron)
POST   /api/accounting/leases/:id/modify
POST   /api/accounting/leases/:id/terminate
POST   /api/accounting/leases/:id/sublease
GET    /api/accounting/leases/maturity-analysis
GET    /api/accounting/leases/disclosures?periodStart&periodEnd
GET    /api/accounting/leases/rou-rollforward
```

## أزرار UI

| الصفحة | الزر |
|--------|------|
| `/accounting/leases` | جدول الـ leases مع KPIs (total ROU, total liability) + زر `عقد إيجار جديد` 🟢 |
| Lease Form | tabs: Basic / Payments / Accounting / Schedule preview / Confirm |
| Schedule Preview | جدول كامل (60 صف للـ 5 سنوات) + قابل للتصدير Excel |
| `/accounting/leases/:id` | tabs: Details / Schedule / JEs / Modifications |
| Schedule tab | جدول مع badges (recognized/pending) لكل صف + زر `تشغيل شهري` |
| Modify Modal | radio: term change / payment change / scope / termination + form |
| Termination Modal | termination date + penalty amount + preview JE |
| `/accounting/leases/maturity-analysis` | تقرير + chart (1y, 2-5y, >5y) |
| `/accounting/leases/disclosures` | تقرير IFRS 16 الإفصاحات |

---

# 🟠 النقص 12: Fixed Assets — Component + Impairment + المزيد من طرق الإهلاك

## السبب
`src/lib/fixed-assets-engine.ts` يدعم 3 طرق إهلاك فقط (SL، DB، DDB). يفتقد:
- Sum of Years' Digits
- Units of Production
- MACRS (US tax)
- Component accounting (IAS 16.43)
- Impairment testing (IAS 36)
- Asset transfers + reclassification

## البرومنت الجاهز

```
وسّع src/lib/fixed-assets-engine.ts:

1. طرق إهلاك إضافية:
   - SUM_OF_YEARS_DIGITS: depreciation = (remaining_years / sum_of_years) × depreciable_amount
   - UNITS_OF_PRODUCTION: depreciation = (units_used_in_period / total_estimated_units) × depreciable_amount
   - MACRS (US): IRS tables (3-yr, 5-yr, 7-yr, 10-yr classes)
   - HOURS_OF_OPERATION: similar to UoP لكن للساعات

2. Component Accounting (IAS 16.43):
   - Asset كله مقسم لـ components (e.g., building = structure + roof + HVAC + elevator)
   - كل component له:
     - cost
     - useful life مختلفة
     - depreciation method مختلفة
   - replacement cost لـ component → derecognize old + capitalize new
   - useful life review سنوي

3. Impairment Testing (IAS 36):
   - cash-generating unit (CGU) tracking
   - recoverable amount = max(fair value - costs to sell, value in use)
   - if recoverable < carrying → impairment
   - JE: DR Impairment Loss / CR Accumulated Impairment
   - reversal allowed (لـ assets غير goodwill)

4. Asset Transfers:
   - بين departments / branches / locations
   - JE optional لو cost center مختلف
   - audit trail

5. Asset Reclassification:
   - من inventory لـ fixed asset
   - من fixed asset لـ held-for-sale
   - من intangible لـ tangible
   - JE وفق نوع التحويل

6. Asset Insurance:
   - track insurance policy + expiry + premium
   - claim management
   - alert before expiry

7. Asset Maintenance:
   - planned maintenance schedule
   - cost capture
   - capitalization vs expense decision
   - significant maintenance → component approach

8. Asset Counting (Physical):
   - barcode/RFID scan
   - count plan generation
   - variance report
   - JE for losses/gains

9. CWIP Aging:
   - report: assets in CWIP > X months
   - alert للـ capitalize

10. Bonus Depreciation / Section 179:
    - US-specific
    - configurable per asset class

11. Half-Year / Mid-Month Convention:
    - acquired in Q3 → only 50% depreciation in year 1
    - configurable per company
```

## السيناريو

```
سيناريو 1 - Component Accounting:
شراء مبنى بـ 5,000,000 SAR
- structure: 3,500,000 (50 سنة)
- roof: 500,000 (20 سنة)
- HVAC: 600,000 (15 سنة)
- elevator: 400,000 (10 سنة)

→ 4 سجلات FixedAsset كل واحد بإهلاك مستقل
→ شهرياً 4 JEs منفصلة

بعد 8 سنوات: استبدال HVAC الجديد 750,000
→ derecognize old HVAC:
   DR Accum. Depreciation HVAC (8/15 × 600K = 320K)
   DR Loss on Disposal (280K)
   CR HVAC Asset (600K)
→ capitalize new HVAC: 750,000 + إهلاك جديد على 15 سنة

سيناريو 2 - Impairment:
آلة بقيمة دفترية 800,000، recoverable amount = 600,000
→ DR Impairment Loss 200,000
→ CR Accumulated Impairment 200,000
→ revised depreciation base = 600,000 على العمر المتبقي

سيناريو 3 - Units of Production:
آلة بـ 1,000,000 SAR، تنتج 500,000 وحدة طوال عمرها
→ هذا الشهر أنتجت 8,000 وحدة
→ depreciation = (8,000/500,000) × 1,000,000 = 16,000

سيناريو 4 - Asset Transfer:
نقل سيارة من فرع الرياض لفرع جدة
→ FixedAsset.locationId يتغير
→ لو cost centers مختلفة + شركتين فرعيتين:
  JE inter-branch transfer (للقيمة الدفترية)
```

## تدفق البيانات

```
[Asset Creation - Component]
   ↓
POST /api/fixed-assets
   { name, totalCost, components: [{name, cost, life, method}] }
   ↓
   create parent FixedAsset + child components
   ↓
   create JE: DR each component / CR Cash/Payable
   ↓
   schedule cron for each component

[Monthly Depreciation]
   ↓
DepreciationEngine.runMonthly()
   ↓
   for each active asset:
     - get method (SL/DB/DDB/SoYD/UoP/MACRS/HoO)
     - calculate period depreciation
     - check if exceeds depreciable amount → cap
     - create JE
     - update FixedAsset.accumulatedDepreciation + currentBookValue
   ↓
   handle UoP: needs production units input

[Impairment Testing]
   ↓
POST /api/fixed-assets/:id/test-impairment
   { recoverableAmount, calculationMethod, evidence }
   ↓
   if recoverable < bookValue → create ImpairmentRecord + JE
   ↓
   recalculate future depreciation

[Asset Transfer]
   ↓
POST /api/fixed-assets/:id/transfer
   { newLocationId, newCostCenterId, transferDate, reason }
   ↓
   if cross-cost-center → create JE
   ↓
   update FixedAsset + log AssetTransferRecord

[Component Replacement]
   ↓
POST /api/fixed-assets/:parentId/replace-component
   { componentId, newCost, replacementDate }
   ↓
   derecognize old (JE)
   ↓
   create new component (JE)
```

## Prisma Schema (إضافات)

```prisma
model FixedAsset {
  // ... existing
  parentAssetId       Int?      // for components
  parentAsset         FixedAsset? @relation("AssetComponents", fields: [parentAssetId], references: [id])
  components          FixedAsset[] @relation("AssetComponents")
  isComponent         Boolean   @default(false)
  
  depreciationMethod  String    // 'STRAIGHT_LINE' | 'DECLINING_BALANCE' | 'DOUBLE_DECLINING' | 'SUM_OF_YEARS_DIGITS' | 'UNITS_OF_PRODUCTION' | 'MACRS_3' | 'MACRS_5' | 'MACRS_7' | 'MACRS_10' | 'HOURS_OF_OPERATION'
  
  // For UoP / HoO
  totalEstimatedUnits Decimal?  @db.Decimal(20,4)
  unitsConsumed       Decimal   @default(0) @db.Decimal(20,4)
  
  // Convention
  depreciationConvention String @default("FULL_MONTH")  // FULL_MONTH | HALF_YEAR | MID_MONTH | MID_QUARTER
  
  // Impairment
  accumulatedImpairment Decimal @default(0) @db.Decimal(20,4)
  lastImpairmentTestDate DateTime?
  impairmentRecords   AssetImpairmentRecord[]
  cguId               Int?      // Cash-Generating Unit
  
  // Insurance
  insurancePolicyNumber String?
  insuranceProvider   String?
  insurancePremium    Decimal?  @db.Decimal(10,2)
  insuranceExpiryDate DateTime?
  insuredValue        Decimal?  @db.Decimal(20,4)
  
  // Location + Transfer
  locationId          Int?
  branchId            Int?
  custodianEmployeeId Int?
  transferRecords     AssetTransferRecord[]
  
  // Status extensions
  status              String    // 'ACTIVE' | 'CWIP' | 'DISPOSED' | 'WRITTEN_OFF' | 'TRANSFERRED' | 'HELD_FOR_SALE' | 'IMPAIRED'
  heldForSaleDate     DateTime?
  
  // Maintenance
  maintenanceRecords  AssetMaintenanceRecord[]
  nextMaintenanceDate DateTime?
}

model AssetImpairmentRecord {
  id                  Int       @id @default(autoincrement())
  assetId             Int
  asset               FixedAsset @relation(fields: [assetId], references: [id])
  testDate            DateTime
  carryingAmount      Decimal   @db.Decimal(20,4)
  fairValueLessCosts  Decimal?  @db.Decimal(20,4)
  valueInUse          Decimal?  @db.Decimal(20,4)
  recoverableAmount   Decimal   @db.Decimal(20,4)
  impairmentLoss      Decimal   @db.Decimal(20,4)
  reversal            Boolean   @default(false)
  reversalReason      String?
  journalEntryId      Int
  evidence            String?
  testedByUserId      String
  approvedByUserId    String?
  approvedAt          DateTime?
}

model AssetTransferRecord {
  id                  Int       @id @default(autoincrement())
  assetId             Int
  asset               FixedAsset @relation(fields: [assetId], references: [id])
  transferDate        DateTime
  fromLocationId      Int?
  toLocationId        Int?
  fromBranchId        Int?
  toBranchId          Int?
  fromCostCenterId    Int?
  toCostCenterId      Int?
  fromCustodianId     Int?
  toCustodianId       Int?
  reason              String
  journalEntryId      Int?
  bookValueAtTransfer Decimal   @db.Decimal(20,4)
  approvedByUserId    String?
  createdByUserId     String
  createdAt           DateTime  @default(now())
}

model AssetMaintenanceRecord {
  id                  Int       @id @default(autoincrement())
  assetId             Int
  asset               FixedAsset @relation(fields: [assetId], references: [id])
  type                String    // 'PREVENTIVE' | 'CORRECTIVE' | 'INSPECTION' | 'OVERHAUL'
  scheduledDate       DateTime?
  performedDate       DateTime?
  cost                Decimal?  @db.Decimal(20,4)
  capitalize          Boolean   @default(false)
  description         String?
  performedBy         String?
  vendorId            Int?
  journalEntryId      Int?
  nextDueDate         DateTime?
}

model CashGeneratingUnit {
  id                  Int       @id @default(autoincrement())
  name                String
  description         String?
  assets              FixedAsset[]
  lastTestDate        DateTime?
  recoverableAmount   Decimal?  @db.Decimal(20,4)
}

model AssetUsageLog {
  id                  Int       @id @default(autoincrement())
  assetId             Int
  asset               FixedAsset @relation(fields: [assetId], references: [id])
  periodStart         DateTime
  periodEnd           DateTime
  unitsProduced       Decimal?  @db.Decimal(20,4)
  hoursOperated       Decimal?  @db.Decimal(20,4)
  recordedByUserId    String
  recordedAt          DateTime  @default(now())
}
```

## API Endpoints

```
POST   /api/fixed-assets
POST   /api/fixed-assets/:id/components               (add component)
POST   /api/fixed-assets/:id/replace-component
POST   /api/fixed-assets/run-depreciation             (cron monthly)
POST   /api/fixed-assets/:id/log-usage                (for UoP)
POST   /api/fixed-assets/:id/test-impairment
POST   /api/fixed-assets/:id/reverse-impairment
POST   /api/fixed-assets/:id/transfer
POST   /api/fixed-assets/:id/reclassify
POST   /api/fixed-assets/:id/dispose
POST   /api/fixed-assets/:id/mark-held-for-sale
POST   /api/fixed-assets/:id/maintenance
POST   /api/fixed-assets/:id/insurance
GET    /api/fixed-assets/cwip-aging
GET    /api/fixed-assets/insurance-expiring
GET    /api/fixed-assets/maintenance-due
GET    /api/fixed-assets/cgu-list
POST   /api/fixed-assets/cgu
POST   /api/fixed-assets/physical-count/start
POST   /api/fixed-assets/physical-count/scan
POST   /api/fixed-assets/physical-count/finalize
GET    /api/fixed-assets/reports/depreciation-schedule?assetId
GET    /api/fixed-assets/reports/asset-register
GET    /api/fixed-assets/reports/disposals?dateFrom&dateTo
```

## أزرار UI

| الصفحة | الزر |
|--------|------|
| `/fixed-assets` | جدول + KPIs (total cost، NBV، CWIP، due maintenance) + زر `أصل جديد` 🟢 |
| Asset Form | tabs: Basic / Components / Depreciation / Insurance / Location |
| Components tab | زر `إضافة component` + جدول components مع NBV لكل واحد |
| `/fixed-assets/:id` | tabs: Details / Components / Depreciation Schedule / Maintenance / Transfers / Impairment |
| Depreciation tab | dropdown method + UoP/HoO inputs + زر `إعادة احتساب الجدول` |
| Impairment tab | زر `اختبار الانخفاض` 🟡 → form (recoverable + evidence) → preview JE |
| Transfer Modal | dropdowns: location, branch, cost center, custodian + reason + توقيع |
| Maintenance tab | جدول schedule + زر `تسجيل صيانة` + radio: capitalize/expense |
| `/fixed-assets/cwip` | جدول CWIP + aging + زر `Capitalize` لكل صف |
| `/fixed-assets/physical-count` | wizard: select assets → scan barcode → reconcile → finalize |
| `/fixed-assets/maintenance-due` | جدول الصيانة المستحقة + alert |
| `/fixed-assets/insurance-expiring` | جدول التأمينات المنتهية خلال 30 يوم |

---

# 📋 خلاصة التنفيذ

## الترتيب المُوصى به

| الأسبوع | الموديول | المخرجات |
|---------|----------|----------|
| 1 | TOTP/MFA Real (#1) | otplib + backup codes + rate limit |
| 2-3 | Year-End Close (#2) | Wizard 8 خطوات + 25 task checklist |
| 4-5 | Open Items + Customer Statements (#3, #4) | Multi-currency + PDF + Email |
| 6-7 | Dunning Automation (#5) | Templates + Email + Promise-to-Pay |
| 8-10 | Payment Runs + Bank Files (#6) | SARIE/SEPA/SWIFT |
| 11-12 | Bank Importers + Reconciliation (#7, #8) | CAMT.053 + OFX + Exception Queue |
| 13-15 | Multi-Book + Revenue Recognition + Lease (#9, #10, #11) | IFRS 15/16 fully posted |
| 16-18 | Fixed Assets Advanced (#12) | Components + Impairment + 6 methods |

## الناتج المتوقع

**قبل:** 59% اكتمال vs Global ERP
**بعد:** 78%+ اكتمال

**سيتجاوز:**
- ✅ QuickBooks (في كل المجالات)
- ✅ Sage Intacct
- ✅ Xero
- ✅ Odoo Community

**سيقترب من:**
- ⚖️ Odoo Enterprise (gap → 5%)
- ⚖️ NetSuite (gap → 12%)

## ملاحظات تنفيذية

1. **كل migration → اختبر على dev tenant أولاً**
2. **كل auto-journal → راجعه مع CPA قبل deploy**
3. **كل feature → اكتب unit tests + integration tests**
4. **كل تغيير schema → استخدم `prisma migrate dev --name <descriptive>`**
5. **كل API → استخدم Zod للـ validation + `tenantId` من middleware**
6. **كل UI → اتبع `src/components/ui/*` patterns الموجودة**
7. **كل background job → استخدم BullMQ أو cron مع retry logic**

---

**نهاية المستند**

> هذا الملف قابل للنسخ كاملاً أو مقطّعاً. كل قسم مستقل بذاته ويمكن استخدامه كبرومنت منفصل لـ Claude Code أو AI آخر لتنفيذه.
