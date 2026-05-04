# النقص #1: TOTP/MFA الحقيقي — مواصفات تفصيلية

> **المرجعيات العالمية:** Okta MFA، Auth0、Microsoft Authenticator、Google Workspace、AWS IAM、Duo Security، 1Password
> **معايير:** RFC 6238 (TOTP)، RFC 4226 (HOTP)، NIST SP 800-63B (AAL2)、PCI-DSS 8.4.2、ISO 27001 A.9.4.2

---

## 1. البرومنت الكامل للنسخ

```
[انسخ المحتوى التالي للصق في session جديد]

اعمل refactor كامل للـ MFA في المشروع Namasoft ERP:

ملفات المراجع الموجودة:
- src/lib/totp.ts (حالياً mock)
- src/lib/mfa-engine.ts (skeleton)
- src/app/api/auth/* (existing routes)

المتطلبات الإلزامية:

A) المكتبات:
   npm install otplib qrcode bcryptjs
   npm install -D @types/qrcode

B) الـ Schema (أضف لـ prisma/schema.prisma):
   - User: totpSecretEncrypted, totpIv, totpAuthTag, mfaEnabled,
     mfaPendingActivation, mfaEnrolledAt, mfaFailedAttempts, mfaLockedUntil,
     mfaMethod (TOTP|SMS|EMAIL|HARDWARE_KEY), mfaRequiredByPolicy
   - UserBackupCode: id, userId, codeHash (bcrypt), usedAt, createdAt, ipUsedFrom
   - MfaAttempt: id, userId, success, ipAddress, userAgent, attemptedAt,
     method (totp|backup_code|sms|email), failureReason
   - TrustedDevice: id, userId, deviceFingerprint, deviceName,
     trustedUntil, ipAddress, userAgent, createdAt
   - MfaPolicy: id, name, requireForRoles[], requireForActions[],
     trustedDeviceDays, sessionTimeoutMinutes, allowedMethods[],
     enforceFromDate, gracePeriodDays

C) الـ Engine (src/lib/mfa-engine.ts):
   - enroll(userId, method): generates secret, encrypts with AES-256-GCM
   - confirmEnrollment(userId, code): validates first code, activates MFA
   - verify(userId, code, method, deviceFingerprint?): main verification
   - generateBackupCodes(userId): 10 codes, 8 chars base32, bcrypt hashed
   - verifyBackupCode(userId, code)
   - trustDevice(userId, deviceFingerprint, days)
   - disable(userId, password, currentMfaCode): requires both
   - rateLimit: 5 fails / 15min → lock 30min
   - replayProtection: store last 10 used tokens (TTL 90s)
   - audit: log every attempt (success/fail) with full context

D) الـ APIs الـ 11 endpoints:
   POST /api/auth/mfa/enroll
   POST /api/auth/mfa/confirm
   POST /api/auth/mfa/verify
   POST /api/auth/mfa/backup-verify
   POST /api/auth/mfa/disable
   POST /api/auth/mfa/regenerate-codes
   GET  /api/auth/mfa/status
   GET  /api/auth/mfa/qr-code
   POST /api/auth/mfa/trust-device
   DELETE /api/auth/mfa/trusted-devices/:id
   GET  /api/auth/mfa/audit-log

E) UI Pages:
   - /settings/security: enrollment + backup codes + trusted devices
   - /login: 2-step verification
   - /admin/security/mfa-policy: enforce policies
   - /admin/security/mfa-audit: audit log viewer

F) Compliance:
   - PCI-DSS: log all MFA events
   - GDPR/PDPL: encrypt secrets, allow export of MFA data
   - SOC 2: retention policy (audit logs 1 year minimum)

G) Testing:
   - 25+ unit tests (totp, backup codes, rate limit, replay)
   - 8 integration tests (full enrollment + login + recovery flows)
   - 4 E2E tests (Playwright: enroll → login → trust device → revoke)

اتبع نمط الكود الموجود في المشروع. استخدم Prisma transactions للعمليات المركبة.
```

---

## 2. السيناريوهات الكاملة (8 سيناريوهات)

### سيناريو A — التفعيل الأول للمستخدم العادي
```
1. المستخدم يدخل /settings/security
2. يرى بطاقة "المصادقة الثنائية" — حالة: "غير مفعّلة"
3. يضغط [تفعيل MFA]
4. Modal يظهر مع 3 خيارات:
   • Authenticator App (Google/Microsoft/Authy)  ← موصى به
   • SMS  (يحتاج رقم محقّق)
   • Email
5. يختار "Authenticator App" → Modal جديد:
   • QR Code كبير
   • تحت QR: الـ secret كنص (للنسخ يدوياً)
   • حقل "أدخل الكود من التطبيق" (6 أرقام)
   • زر [تأكيد]
6. يمسح QR بـ Google Authenticator → يظهر الكود في تطبيقه
7. يكتب الكود → [تأكيد]
8. النظام يتحقق:
   ✓ → MFA مفعّل + Modal جديد:
       "احفظ هذه الـ Backup Codes — لن تظهر مرة أخرى"
       جدول 10 codes (XXXX-XXXX format)
       3 أزرار: [نسخ الكل] [تنزيل PDF] [طباعة]
       checkbox: "✓ حفظتها في مكان آمن"
       زر [إنهاء] (معطّل حتى يُفعّل checkbox)
   ✗ → "كود خاطئ — حاول مرة أخرى" (3 محاولات قبل إعادة QR)
9. يعود لـ /settings/security → الحالة الآن: "مفعّلة (TOTP)"
```

### سيناريو B — تسجيل الدخول مع MFA
```
1. /login: يدخل email + password → [دخول]
2. النظام يتحقق من password ✓
3. يفحص user.mfaEnabled = true
4. Redirect إلى /login/mfa مع sessionToken (5 min TTL)
5. شاشة جديدة:
   • "أدخل الكود من Authenticator"
   • حقل 6 أرقام (auto-focus، auto-submit عند 6 digits)
   • أسفله: "هل لا تستطيع الوصول؟" → [استخدم Backup Code]
   • أسفله: checkbox "✓ ثق بهذا الجهاز لـ 30 يوم"
   • زر [تحقق]
6. يدخل الكود:
   ✓ → JWT issued + redirect إلى /dashboard
       لو checkbox مفعّل → save TrustedDevice
   ✗ المحاولة الـ1: "كود خاطئ"
   ✗ المحاولة الـ5: "تم قفل الحساب 30 دقيقة"
       + email تنبيه + admin alert إذا > 3 محاولات
```

### سيناريو C — استخدام Backup Code
```
1. سيناريو B خطوة 5 → يضغط [استخدم Backup Code]
2. شاشة:
   • "أدخل أحد الـ Backup Codes (XXXX-XXXX)"
   • حقل (16 char with hyphen)
   • تحذير: "⚠ هذا الكود سيُستهلك ولن يعمل مرة أخرى"
3. يدخل → التحقق:
   ✓ → دخول + mark code as used + email للمستخدم: "تم استخدام backup code #X"
       + إشعار في dashboard: "متبقي 9 backup codes — جدّدها قريباً"
   ✗ → "كود خاطئ"
```

### سيناريو D — نسيان الجهاز (Recovery)
```
1. المستخدم لا يملك الجهاز ولا backup codes
2. /login → بعد password → /login/mfa
3. يضغط "هل لا تستطيع الوصول؟" → [طلب إعادة تعيين MFA]
4. يدخل email + cause + يرفع ID
5. Email للأدمن مع طلب
6. Admin يفتح /admin/users/:id/security:
   • يرى آخر 50 محاولة دخول
   • يرى آخر IP، الموقع، الجهاز
   • يرى trusted devices
   • زر [إعادة تعيين MFA] (يتطلب 2FA من admin نفسه)
7. Admin يوافق → المستخدم يستلم email
8. عند الدخول التالي → enrollment flow من جديد
```

### سيناريو E — Admin يفرض MFA على دور
```
1. /admin/security/mfa-policy
2. يضغط [+ سياسة جديدة]
3. Form:
   • اسم السياسة: "Finance Team MFA"
   • الأدوار المطلوبة: multi-select [Accountant, Finance Manager, CFO]
   • طرق مسموحة: checkboxes [TOTP ✓, SMS ✗, Email ✗, Hardware ✓]
   • فترة الأجهزة الموثوقة: 30 يوم (slider 1-90)
   • فترة سماح للتفعيل: 7 أيام
   • تاريخ بدء التطبيق: 2026-06-01
   • [حفظ + تفعيل]
4. كل المستخدمين في الأدوار المحددة:
   • email: "يجب تفعيل MFA قبل 2026-06-08"
   • banner في dashboard
   • بعد deadline: لا دخول إلا بـ MFA
```

### سيناريو F — Trusted Device Management
```
1. /settings/security → بطاقة "الأجهزة الموثوقة"
2. جدول:
   • اسم الجهاز (auto-detected): "Chrome on Windows 11"
   • IP: 196.x.x.x (Riyadh)
   • تاريخ التوثيق: 2026-04-15
   • صلاحية: 16 يوم متبقية
   • آخر استخدام: قبل 3 ساعات
   • زر [إلغاء التوثيق] 🔴
3. زر علوي: [إلغاء توثيق كل الأجهزة] 🔴
   confirmation: "ستحتاج MFA في كل جهاز عند الدخول التالي"
```

### سيناريو G — Replay Attack Prevention
```
- مستخدم يدخل كود 123456 الساعة 10:30:00 → ✓
- attacker يلتقط الكود ويحاول 10:30:15 → ✗ "تم استخدام هذا الكود"
- TTL للحماية: 90 ثانية (3 windows × 30s)
```

### سيناريو H — Step-up Authentication
```
- المستخدم داخل بـ MFA منذ 4 ساعات
- يحاول عملية حساسة: حذف 100 قيد محاسبة
- النظام يطلب MFA مرة أخرى (step-up):
  • "هذه العملية حساسة — أكّد هويتك"
  • حقل MFA code
  • [تأكيد] → continue
- لو رفض → cancel operation
```

---

## 3. تدفق البيانات التفصيلي

### Sequence Diagram — Enrollment

```
[Browser]              [Next.js API]           [Engine]              [DB]
    |                       |                      |                  |
    |-- POST /enroll ------>|                      |                  |
    |    {method: TOTP}     |-- enroll(uid) ------>|                  |
    |                       |                      |-- check user --->|
    |                       |                      |<-- user data ----|
    |                       |                      |                  |
    |                       |                      |  generateSecret()|
    |                       |                      |  AES-256-GCM     |
    |                       |                      |  encrypt(secret) |
    |                       |                      |                  |
    |                       |                      |-- INSERT --------|->
    |                       |                      |    User.totpSecretEncrypted
    |                       |                      |    User.mfaPendingActivation = true
    |                       |                      |                  |
    |                       |                      |  generateQR()    |
    |                       |<-- {qrPng, secret}--|                  |
    |<-- {qrBase64,        |                      |                  |
    |     manualSecret}     |                      |                  |
    |                                                                 |
    | [user scans QR]                                                 |
    |                                                                 |
    |-- POST /confirm ----->|                      |                  |
    |    {code: "123456"}   |-- confirmEnroll() -->|                  |
    |                       |                      |-- SELECT user -->|
    |                       |                      |<-- secret ciphertext
    |                       |                      |                  |
    |                       |                      |  decrypt secret  |
    |                       |                      |  authenticator.check
    |                       |                      |    (code, secret)|
    |                       |                      |    ✓             |
    |                       |                      |                  |
    |                       |                      |-- UPDATE user -->|
    |                       |                      |    mfaEnabled = true
    |                       |                      |    mfaPendingActivation = false
    |                       |                      |    mfaEnrolledAt = now()
    |                       |                      |                  |
    |                       |                      |  generateBackup()|
    |                       |                      |  10 × 8-char     |
    |                       |                      |  bcrypt each     |
    |                       |                      |-- INSERT 10 ---->|
    |                       |                      |   UserBackupCode |
    |                       |                      |                  |
    |                       |                      |-- INSERT ------->|
    |                       |                      |   AuditLog       |
    |                       |                      |   (mfa_enrolled) |
    |                       |<-- {success,        |                  |
    |                       |     backupCodes[]}  |                  |
    |<-- {backupCodes,      |                      |                  |
    |     warningMessage}   |                      |                  |
```

---

## 4. Prisma Schema — كامل

```prisma
model User {
  // ... existing fields
  
  // MFA Core
  totpSecretEncrypted   String?   @db.Text
  totpIv                String?   @db.VarChar(32)
  totpAuthTag           String?   @db.VarChar(32)
  mfaEnabled            Boolean   @default(false)
  mfaMethod             String?   // 'TOTP' | 'SMS' | 'EMAIL' | 'HARDWARE_KEY'
  mfaPendingActivation  Boolean   @default(false)
  mfaEnrolledAt         DateTime?
  mfaLastUsedAt         DateTime?
  
  // Rate Limiting
  mfaFailedAttempts     Int       @default(0)
  mfaLockedUntil        DateTime?
  
  // Policy enforcement
  mfaRequiredByPolicy   Boolean   @default(false)
  mfaPolicyId           Int?
  mfaPolicy             MfaPolicy? @relation(fields: [mfaPolicyId], references: [id])
  mfaGracePeriodEndsAt  DateTime?
  
  // Backup mobile (optional SMS fallback)
  mfaPhoneVerified      String?   // E.164 format
  mfaPhoneVerifiedAt    DateTime?
  
  // Relations
  backupCodes           UserBackupCode[]
  mfaAttempts           MfaAttempt[]
  trustedDevices        TrustedDevice[]
  recoveryRequests      MfaRecoveryRequest[]
  usedTokens            MfaUsedToken[]
}

model UserBackupCode {
  id            Int       @id @default(autoincrement())
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  codeHash      String    // bcrypt
  codeHint      String    // first 2 chars in plain (for display "AB••-••CD")
  usedAt        DateTime?
  ipUsedFrom    String?
  userAgentUsed String?
  createdAt     DateTime  @default(now())
  generatedBatchId String  // groups 10 codes generated together
  
  @@index([userId, usedAt])
  @@index([generatedBatchId])
}

model MfaAttempt {
  id            Int       @id @default(autoincrement())
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  success       Boolean
  method        String    // 'totp' | 'backup_code' | 'sms' | 'email'
  ipAddress     String?
  userAgent     String?
  countryCode   String?   // from IP geolocation
  city          String?
  failureReason String?   // 'invalid_code' | 'expired' | 'replay' | 'rate_limit'
  attemptedAt   DateTime  @default(now())
  sessionId     String?
  deviceFingerprint String?
  
  @@index([userId, attemptedAt])
  @@index([attemptedAt])
  @@index([ipAddress])
}

model TrustedDevice {
  id                Int       @id @default(autoincrement())
  userId            String
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  deviceFingerprint String    @unique
  deviceName        String    // "Chrome on Windows 11"
  browser           String?
  os                String?
  ipAddress         String
  countryCode       String?
  city              String?
  trustedAt         DateTime  @default(now())
  trustedUntil      DateTime
  lastUsedAt        DateTime?
  revokedAt         DateTime?
  revokedReason     String?
  revokedByUserId   String?   // self or admin
  
  @@index([userId, trustedUntil])
  @@index([deviceFingerprint])
}

model MfaPolicy {
  id                    Int       @id @default(autoincrement())
  name                  String
  description           String?
  enabled               Boolean   @default(true)
  requireForRoles       String[]  // ['ADMIN', 'CFO', 'ACCOUNTANT']
  requireForActions     String[]  // ['DELETE_JE', 'POST_PAYMENT', 'CHANGE_BANK_ACCOUNT']
  allowedMethods        String[]  // ['TOTP', 'HARDWARE_KEY']
  trustedDeviceDays     Int       @default(30)
  sessionTimeoutMinutes Int       @default(480)  // 8 hours
  enforceFromDate       DateTime
  gracePeriodDays       Int       @default(7)
  stepUpRequired        Boolean   @default(false)
  stepUpAfterMinutes    Int       @default(60)
  createdByUserId       String
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  users                 User[]
  
  @@index([enforceFromDate])
}

model MfaRecoveryRequest {
  id                Int       @id @default(autoincrement())
  userId            String
  user              User      @relation(fields: [userId], references: [id])
  requestedAt       DateTime  @default(now())
  reason            String
  evidenceFileUrl   String?   // ID upload
  ipAddress         String
  status            String    @default("PENDING")  // PENDING | APPROVED | REJECTED | EXPIRED
  reviewedByUserId  String?
  reviewedAt        DateTime?
  reviewNotes       String?
  newSecretGenerated Boolean  @default(false)
  
  @@index([userId, status])
  @@index([status, requestedAt])
}

model MfaUsedToken {
  id          Int       @id @default(autoincrement())
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenHash   String    // SHA-256 of code (for replay protection)
  usedAt      DateTime  @default(now())
  expiresAt   DateTime  // 90 seconds after usedAt
  
  @@unique([userId, tokenHash])
  @@index([expiresAt])  // for cleanup cron
}
```

---

## 5. Forms & Fields — كل الفورمز

### Form A: MFA Enrollment Method Selection
| Field | Type | Required | Validation | Default | Tooltip |
|-------|------|----------|------------|---------|---------|
| method | radio | ✓ | enum [TOTP, SMS, EMAIL, HARDWARE_KEY] | TOTP | "TOTP موصى به للأمان الأقوى" |

### Form B: TOTP QR Display + Confirmation
| Field | Type | Required | Validation | Default | Tooltip |
|-------|------|----------|------------|---------|---------|
| qrCodeImage | display only | — | — | — | "امسح بـ Google/Microsoft Authenticator" |
| manualSecret | display + copy button | — | — | — | "للنسخ اليدوي إذا لم تتمكن من المسح" |
| confirmationCode | text (6 digits) | ✓ | regex `^\d{6}$` | — | "الكود الحالي من تطبيقك" |
| rememberDevice | checkbox | ✗ | — | false | "ثق بهذا المتصفح لـ 30 يوم" |

### Form C: SMS MFA Setup
| Field | Type | Required | Validation | Default | Tooltip |
|-------|------|----------|------------|---------|---------|
| phoneNumber | tel | ✓ | E.164 + libphonenumber valid | — | "+966xxxxxxxxx" |
| countryCode | dropdown | ✓ | ISO 3166-1 | SA | flag icons |
| smsVerificationCode | text (6 digits) | ✓ | regex + max 5 attempts | — | يظهر بعد إرسال SMS |

### Form D: Backup Codes Display (post-enrollment)
| Field | Type | Required | Validation | Default | Tooltip |
|-------|------|----------|------------|---------|---------|
| codes (×10) | display read-only grid | — | — | — | "احفظها — لن تظهر مرة أخرى" |
| confirmedSaved | checkbox | ✓ to enable next | — | false | "أؤكد أنني حفظت الأكواد في مكان آمن" |

### Form E: Login MFA Verification
| Field | Type | Required | Validation | Default | Tooltip |
|-------|------|----------|------------|---------|---------|
| code | text (6 digits) | ✓ | regex `^\d{6}$`, auto-submit | — | "الكود من Authenticator" |
| trustDevice | checkbox | ✗ | — | false | "ثق بهذا الجهاز لـ 30 يوم" |
| useBackupCode | toggle link | — | — | — | يفتح Form F |

### Form F: Backup Code Entry
| Field | Type | Required | Validation | Default | Tooltip |
|-------|------|----------|------------|---------|---------|
| backupCode | text (8 chars + hyphen) | ✓ | regex `^[A-Z2-7]{4}-[A-Z2-7]{4}$` | — | "XXXX-XXXX" |

### Form G: MFA Recovery Request
| Field | Type | Required | Validation | Default | Tooltip |
|-------|------|----------|------------|---------|---------|
| email | email | ✓ | valid email | from session | — |
| reason | textarea | ✓ | min 50 chars | — | "اشرح سبب فقدان الوصول" |
| identityDocument | file upload | ✓ | PDF/JPG/PNG, max 5MB | — | "صورة هوية + ID" |
| recoveryEmail | email | ✗ | valid email | — | "بريد بديل للتواصل" |

### Form H: MFA Policy Editor (Admin)
| Field | Type | Required | Validation | Default | Tooltip |
|-------|------|----------|------------|---------|---------|
| name | text | ✓ | min 3, max 100, unique | — | اسم وصفي |
| description | textarea | ✗ | max 500 | — | — |
| enabled | toggle | ✓ | — | true | — |
| requireForRoles | multi-select | ✗ (one of roles/actions) | from Role table | [] | الأدوار المُلزمة |
| requireForActions | multi-select | ✗ | from action catalog | [] | العمليات الحساسة |
| allowedMethods | checkboxes | ✓ | min 1 selected | [TOTP] | طرق MFA المسموحة |
| trustedDeviceDays | slider | ✓ | 1-90 | 30 | فترة الثقة |
| sessionTimeoutMinutes | number | ✓ | 5-1440 | 480 | timeout الجلسة |
| enforceFromDate | datepicker | ✓ | >= today | today + 7d | متى يبدأ التطبيق |
| gracePeriodDays | number | ✓ | 0-30 | 7 | مهلة التفعيل |
| stepUpRequired | toggle | ✗ | — | false | step-up للعمليات الحساسة |
| stepUpAfterMinutes | number | conditional | 5-240 | 60 | بعد كم دقيقة |

---

## 6. Tables & Columns — كل الجداول

### Table A: Trusted Devices (`/settings/security`)
| Column | Type | Sortable | Filterable | Width | Actions |
|--------|------|----------|-----------|-------|---------|
| Device | text + icon (browser) | ✓ | ✓ search | 200px | — |
| OS | text | ✓ | dropdown | 120px | — |
| IP Address | text | ✓ | ✓ search | 130px | hover: country flag |
| Location | text (city) | ✓ | dropdown | 130px | — |
| Trusted At | datetime | ✓ desc default | date range | 150px | relative time |
| Expires In | days | ✓ | — | 100px | red if <3d |
| Last Used | datetime | ✓ | date range | 150px | relative time |
| Status | badge | ✓ | dropdown | 100px | Active/Expired/Revoked |
| Actions | buttons | — | — | 120px | [Revoke] [Extend] |

### Table B: MFA Audit Log (`/admin/security/mfa-audit`)
| Column | Type | Sortable | Filterable | Width | Actions |
|--------|------|----------|-----------|-------|---------|
| Timestamp | datetime | ✓ desc | date range | 160px | timezone-aware |
| User | link → user profile | ✓ | search | 180px | avatar + name |
| Action | enum badge | ✓ | dropdown | 130px | enroll/verify/disable |
| Method | badge | ✓ | dropdown | 100px | TOTP/Backup/SMS |
| Result | badge | ✓ | toggle | 100px | ✓/✗ colored |
| Failure Reason | text | — | dropdown | 180px | only if failed |
| IP Address | text | ✓ | search | 130px | + flag |
| Country | text | ✓ | dropdown | 100px | — |
| User Agent | text (truncated) | — | — | 200px | hover: full |
| Device | text | — | — | 150px | parsed |
| Risk Score | number 0-100 | ✓ | range | 100px | colored bar |
| Actions | buttons | — | — | 100px | [Investigate] [Block IP] |

### Table C: User MFA Status (`/admin/users` extended)
| Column | Type | Sortable | Filterable | Width | Actions |
|--------|------|----------|-----------|-------|---------|
| Email | text | ✓ | search | 220px | — |
| Role | badge | ✓ | dropdown | 130px | — |
| MFA Status | badge | ✓ | dropdown | 130px | Enabled/Disabled/Pending/Locked |
| Method | badge | ✓ | dropdown | 100px | TOTP/SMS/None |
| Backup Codes Left | number | ✓ | range | 120px | red if <3 |
| Trusted Devices | number | ✓ | — | 100px | link → list |
| Last MFA | datetime | ✓ | date range | 150px | — |
| Failed (24h) | number | ✓ | — | 100px | red if >3 |
| Locked Until | datetime | ✓ | — | 150px | countdown |
| Actions | buttons | — | — | 200px | [Reset MFA] [View Audit] [Force Re-enroll] |

### Table D: Backup Codes Status (`/settings/security`)
| Column | Type | Sortable | Filterable | Width | Actions |
|--------|------|----------|-----------|-------|---------|
| Code (masked) | text | — | — | 150px | "AB••-••CD" |
| Status | badge | ✓ | toggle | 100px | Available/Used |
| Used At | datetime | ✓ | — | 150px | only if used |
| Used From IP | text | — | — | 130px | only if used |
| Generated | datetime | ✓ desc | — | 150px | — |

### Table E: Recovery Requests (`/admin/security/recovery`)
| Column | Type | Sortable | Filterable | Width | Actions |
|--------|------|----------|-----------|-------|---------|
| Requested At | datetime | ✓ desc | date range | 150px | — |
| User | link | ✓ | search | 200px | — |
| Reason (truncated) | text | — | search | 250px | hover: full |
| Identity Doc | link | — | — | 100px | open viewer |
| IP | text | ✓ | search | 130px | + country |
| Status | badge | ✓ | dropdown | 100px | Pending/Approved/Rejected/Expired |
| Reviewed By | link | ✓ | search | 150px | — |
| Reviewed At | datetime | ✓ | date range | 150px | — |
| Actions | buttons | — | — | 200px | [Approve] [Reject] [Investigate] |

---

## 7. Buttons & Actions — كل الأزرار

| ID | الزر | الموقع | اللون | الحالة الفعّالة | Confirmation | الصلاحية | Audit |
|----|------|--------|-------|------------------|--------------|----------|-------|
| btn-mfa-enroll | تفعيل MFA | /settings/security | 🟦 | mfaEnabled=false | ✗ | self | log "mfa.enroll.start" |
| btn-mfa-confirm | تأكيد التفعيل | enrollment modal | 🟢 | code entered | ✗ | self | log "mfa.enroll.confirm" |
| btn-mfa-cancel-enroll | إلغاء التفعيل | enrollment modal | ⬜ | always | confirm if pending | self | log "mfa.enroll.cancel" |
| btn-mfa-copy-secret | نسخ السر | enrollment modal | ⬜ | always | ✗ | self | log "mfa.secret.copied" |
| btn-mfa-download-qr | تنزيل QR | enrollment modal | ⬜ | always | ✗ | self | log "mfa.qr.downloaded" |
| btn-backup-copy-all | نسخ كل الأكواد | post-enrollment | ⬜ | always | ✗ | self | log "mfa.backup.copied" |
| btn-backup-download | تنزيل PDF | post-enrollment | ⬜ | always | ✗ | self | log "mfa.backup.downloaded" |
| btn-backup-print | طباعة | post-enrollment | ⬜ | always | ✗ | self | log "mfa.backup.printed" |
| btn-backup-finish | إنهاء | post-enrollment | 🟢 | confirmed checkbox | ✗ | self | log "mfa.backup.acknowledged" |
| btn-mfa-verify | تحقق | /login/mfa | 🟦 | code entered | ✗ | anonymous + token | log "mfa.verify.attempt" |
| btn-mfa-use-backup | استخدم Backup Code | /login/mfa | ⬜ link | always | ✗ | anonymous + token | log "mfa.backup.attempt" |
| btn-mfa-recovery | طلب إعادة تعيين | /login/mfa | ⬜ link | always | ✗ | anonymous | log "mfa.recovery.requested" |
| btn-mfa-disable | إلغاء التفعيل | /settings/security | 🔴 | mfaEnabled=true | ⚠ password+code+typed "DISABLE" | self | log "mfa.disable" |
| btn-mfa-regenerate-codes | توليد codes جديدة | /settings/security | 🟡 | mfaEnabled=true | ⚠ "ستُلغى الأكواد القديمة" | self + current MFA code | log "mfa.codes.regenerated" |
| btn-mfa-change-method | تغيير الطريقة | /settings/security | ⬜ | mfaEnabled=true | ⚠ requires re-enrollment | self + current MFA | log "mfa.method.changed" |
| btn-trust-device-revoke | إلغاء الجهاز | trusted devices table | 🔴 | per row | ✗ | self | log "mfa.device.revoked" |
| btn-trust-all-revoke | إلغاء كل الأجهزة | /settings/security | 🔴 | always | ⚠ "ستحتاج MFA في كل جهاز" | self | log "mfa.devices.all_revoked" |
| btn-trust-extend | تمديد | trusted devices table | 🟢 | <7 days remaining | ✗ | self | log "mfa.device.extended" |
| btn-admin-reset-mfa | إعادة تعيين MFA | /admin/users/:id | 🔴 | always | ⚠ requires admin MFA | role.admin AND policy.allow | log "admin.mfa.reset" |
| btn-admin-force-enroll | إجبار التفعيل | /admin/users/:id | 🟡 | mfaEnabled=false | ✗ | role.admin | log "admin.mfa.forced" |
| btn-admin-block-user | حظر المستخدم | /admin/users/:id | 🔴 | always | ⚠ typed username | role.admin | log "admin.user.blocked" |
| btn-admin-recovery-approve | موافقة | /admin/security/recovery | 🟢 | status=PENDING | ⚠ admin MFA | role.admin | log "mfa.recovery.approved" |
| btn-admin-recovery-reject | رفض | /admin/security/recovery | 🔴 | status=PENDING | + reason | role.admin | log "mfa.recovery.rejected" |
| btn-policy-create | + سياسة | /admin/security/mfa-policy | 🟢 | always | ✗ | role.admin | log "mfa.policy.created" |
| btn-policy-edit | تعديل | policy table | ⬜ | always | ✗ | role.admin | log "mfa.policy.edited" |
| btn-policy-delete | حذف | policy table | 🔴 | unused only | ⚠ confirm | role.admin | log "mfa.policy.deleted" |
| btn-policy-toggle | تفعيل/تعطيل | policy table | 🟦 | always | ✗ | role.admin | log "mfa.policy.toggled" |
| btn-export-audit | تصدير | /admin/security/mfa-audit | ⬜ | always | format selector | role.admin | log "mfa.audit.exported" |
| btn-block-ip | حظر IP | audit row | 🔴 | always | ⚠ duration | role.admin | log "security.ip.blocked" |
| btn-investigate | تحقيق | audit row | ⬜ | always | ✗ | role.admin | opens timeline |

**عدد الأزرار:** 30 زر

---

## 8. Search & Filters

### في `/admin/security/mfa-audit`:
- **Date range picker:** اليوم / آخر 7 أيام / آخر 30 يوم / مخصص
- **User search:** بـ email أو name (autocomplete)
- **Action multi-select:** Enroll, Verify, Disable, Recovery, Lock, Unlock
- **Method filter:** TOTP, Backup Code, SMS, Email, Hardware Key
- **Result toggle:** All / Success / Failed
- **Failure reason multi-select:** Invalid Code, Expired, Replay, Rate Limit, IP Blocked
- **Country filter:** dropdown مع flags (geolocation)
- **IP range filter:** CIDR notation
- **Risk score slider:** 0-100
- **Quick filters (chips):**
  - 🚨 High Risk (score > 70)
  - 🔒 Locked Accounts
  - 🌍 Foreign IPs
  - ⚡ Last Hour
  - 🚫 Failed Attempts
- **Saved searches:** save filter combinations

### في `/admin/users`:
- **MFA Status:** All / Enabled / Disabled / Pending / Locked
- **MFA Method:** All / TOTP / SMS / None
- **Compliance:** All / Compliant / Non-compliant / Grace Period
- **Last Login:** Never / Today / This Week / This Month / Inactive

---

## 9. Reports & Exports

| التقرير | الصفحة | الحقول | الفلاتر | تنسيقات | الجدولة |
|---------|--------|--------|---------|----------|---------|
| MFA Adoption | /admin/security/reports | total users, enabled, disabled, % adoption per role | role, dept, date range | PDF/Excel | weekly |
| Failed Attempts Trend | /admin/security/reports | hourly bucket, count, top users, top IPs | date range | PDF/Excel/CSV | daily |
| Security Incidents | /admin/security/reports | locked accounts, suspicious IPs, recovery requests | severity, status, date | PDF/Excel | on-demand |
| Compliance Report | /admin/security/reports | per policy: covered users, compliant %, gaps | policy, date | PDF | monthly |
| Backup Code Usage | /admin/security/reports | users with <3 codes, recently used codes | threshold, date | Excel | weekly |
| Trusted Devices | /admin/security/reports | total devices, expiring soon, foreign devices | user, country, expiry | Excel | on-demand |
| MFA Audit Full Export | /admin/security/mfa-audit | all columns + detailed event data | all filters | CSV/JSON | on-demand |
| Per User MFA History | /admin/users/:id/mfa-history | full timeline | date range | PDF | on-demand |

---

## 10. Dashboards & Widgets

### `/admin/security/dashboard` (5 widgets)

**Widget 1: MFA Adoption Gauge**
- Type: radial gauge
- Metric: % of users with MFA enabled
- Color zones: <50% red, 50-80% yellow, >80% green
- Comparison: vs last month
- Drill-down: → /admin/users?mfa=disabled

**Widget 2: Failed Attempts Heatmap**
- Type: heatmap (24h × 7days)
- Metric: failed MFA attempts per hour
- Color: white → red
- Click: filter audit log to that hour

**Widget 3: Top Risk Users**
- Type: list (top 10)
- Sort: risk score DESC
- Columns: user, score, last incident, action button
- Action: [View] / [Force re-enroll] / [Block]

**Widget 4: Active Recovery Requests**
- Type: badge counter + list
- Metric: pending requests count
- Color: red if >5
- Click: → /admin/security/recovery

**Widget 5: Geographic Distribution**
- Type: world map
- Metric: MFA attempts per country (last 24h)
- Color: success (green) / failed (red) intensity
- Click country: filter audit log

---

## 11. Notifications & Alerts

| Event | Channel | Recipient | Template | Throttle |
|-------|---------|-----------|----------|----------|
| MFA enrolled | email + in-app | user | "تم تفعيل MFA على حسابك" | none |
| MFA disabled | email + in-app + SMS | user + admin | "تم إلغاء MFA — إذا لم يكن أنت تواصل فوراً" | none |
| Backup code used | email + in-app | user | "تم استخدام backup code من IP X" | none |
| 3 failed attempts | in-app | user | "3 محاولات فاشلة" | 1/hour |
| 5 failed → locked | email + SMS + in-app | user + admin | "تم قفل الحساب" | none |
| Foreign IP login | email + push | user | "دخول من بلد جديد" | 1/IP/day |
| Backup codes <3 | in-app banner | user | "جدّد backup codes" | 1/week |
| Trusted device <7d | in-app | user | "جهاز موثوق ينتهي قريباً" | 1/device/week |
| Recovery requested | email | admin | "طلب recovery من X" | none |
| Policy enforcement deadline | email + banner | affected users | "فعّل MFA قبل X" | daily last 7d |
| Suspicious pattern | email + Slack | security team | details | none |

---

## 12. Permissions & Roles Matrix

| Action | Self | Manager | Finance | Admin | Super Admin | Auditor |
|--------|------|---------|---------|-------|-------------|---------|
| Enable own MFA | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Disable own MFA | ✓ * | ✓ * | ✓ * | ✓ * | ✓ * | ✓ * |
| Reset own MFA | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| View own audit | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Reset other's MFA | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| Force re-enrollment | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| Block user | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| Approve recovery | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| Create MFA policy | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| Modify policy | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| View all audit | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ |
| Export audit | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ |
| Block IP | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |

`* requires policy allowance`

---

## 13. Integrations

| الخدمة | الغرض | API/Library |
|--------|------|-------------|
| Twilio / Unifonic | SMS delivery | Twilio SDK / Unifonic API (saudi) |
| SendGrid / AWS SES | Email | nodemailer + SES |
| MaxMind GeoIP2 | IP geolocation | maxmind npm |
| BullMQ + Redis | Cron jobs (cleanup expired tokens, send reminders) | bullmq |
| Vault / AWS KMS | Master encryption key storage | @aws-sdk/client-kms |
| Slack | Security alerts to team | @slack/webhook |
| WhatsApp Business API | Backup OTP delivery | wati.io / 360dialog |
| SIEM (Splunk/ELK) | Forward audit logs | winston-syslog |
| Hardware Keys (YubiKey) | WebAuthn FIDO2 | @simplewebauthn/server |

---

## 14. Keyboard Shortcuts

| Shortcut | Action | Page |
|----------|--------|------|
| `Ctrl+K` | Quick search audit | audit page |
| `R` | Refresh table | any table |
| `E` | Export current view | tables |
| `Esc` | Close modal | any modal |
| `Enter` | Submit MFA code | login MFA |
| `Tab` | Auto-advance digit fields | code inputs |
| `Ctrl+Shift+L` | Lock my session | global |
| `Ctrl+/` | Show all shortcuts | global |

---

## 15. Mobile / Print Views

### Mobile Considerations:
- QR code: tap to expand fullscreen
- Backup codes: native "Copy" + "Save to Files"
- Trusted devices: card layout instead of table
- Verify code: numeric keyboard auto-open
- Push notification support for verification (no code entry)
- Biometric unlock for app session (Touch/Face ID)

### Print Templates:
- **Backup Codes Print Layout:**
  - Company logo
  - User email + date generated
  - 10 codes in 2 columns
  - "احفظ هذه الورقة في مكان آمن" warning
  - Tear strip with hash for verification
- **MFA Audit Report PDF:**
  - Cover page (date range, user, totals)
  - Summary statistics
  - Detailed log table
  - Charts (success rate, hourly distribution)
  - Footer (page X of Y, generated by, hash)

---

## 16. Audit & Logging

كل event يُسجّل في `AuditLog` بالحقول:
- `event`: dotted (e.g., `mfa.verify.success`)
- `userId`, `actorUserId` (if admin acting)
- `entityType`: 'User'
- `entityId`
- `before`, `after`: JSON diff
- `metadata`: { ip, userAgent, country, sessionId, deviceFingerprint, riskScore }
- `severity`: INFO | WARNING | CRITICAL
- `timestamp`

**Retention:**
- Audit logs: 1 year hot, 7 years cold storage
- Failed attempts: 90 days
- Trusted devices: until expiry + 30 days
- Recovery requests: 5 years (compliance)

**Tamper detection:**
- Each log entry chained (previous hash)
- Daily hash anchor to immutable storage

---

## 17. Test Cases

### Unit Tests (target: 25+)

```typescript
// src/lib/__tests__/mfa-engine.test.ts

describe('TOTP Engine', () => {
  test('generates valid 32-char base32 secret', () => {})
  test('encrypts secret with AES-256-GCM', () => {})
  test('decrypts secret correctly', () => {})
  test('verifies correct code within window', () => {})
  test('rejects code outside window (>30s)', () => {})
  test('accepts code from previous window (window=1)', () => {})
  test('rejects malformed code (not 6 digits)', () => {})
})

describe('Backup Codes', () => {
  test('generates exactly 10 unique codes', () => {})
  test('codes are 8 chars from base32 alphabet', () => {})
  test('codes are bcrypt hashed', () => {})
  test('used code cannot be reused', () => {})
  test('verifies code with case-insensitive match', () => {})
  test('handles code with hyphen formatting', () => {})
})

describe('Rate Limiting', () => {
  test('allows 5 attempts in 15 min', () => {})
  test('locks account after 5 failures', () => {})
  test('lock expires after 30 min', () => {})
  test('reset counter on successful verify', () => {})
})

describe('Replay Protection', () => {
  test('rejects same token within 90s', () => {})
  test('allows same token after 90s', () => {})
  test('cleans up expired tokens', () => {})
})

describe('Trusted Devices', () => {
  test('skips MFA for trusted device', () => {})
  test('expires after configured days', () => {})
  test('revoked device requires MFA again', () => {})
})

describe('Policy Enforcement', () => {
  test('enforces MFA for required roles', () => {})
  test('respects grace period', () => {})
  test('allows only configured methods', () => {})
})
```

### Integration Tests

```typescript
// tests/integration/mfa-flow.test.ts

test('Full enrollment + login flow', async () => {
  // 1. Login with password (no MFA)
  // 2. Enable MFA
  // 3. Confirm with TOTP code
  // 4. Receive backup codes
  // 5. Logout
  // 6. Login with password
  // 7. Required to provide MFA code
  // 8. Verify successful
})

test('Recovery flow with admin approval', async () => {
  // 1. User loses device
  // 2. Submits recovery request
  // 3. Admin reviews + approves
  // 4. User receives reset email
  // 5. User re-enrolls
})

test('Lock/unlock cycle', async () => { /* ... */ })
test('Trusted device → expire → re-MFA', async () => { /* ... */ })
test('Policy enforcement on role assignment', async () => { /* ... */ })
test('Admin reset flow with approval', async () => { /* ... */ })
test('Step-up authentication', async () => { /* ... */ })
test('SMS fallback', async () => { /* ... */ })
```

### E2E Tests (Playwright)

```typescript
// e2e/mfa.spec.ts

test('Enroll MFA via UI', async ({ page }) => {
  await page.goto('/settings/security')
  await page.click('[data-testid=btn-mfa-enroll]')
  // ... screenshot QR
  // ... use test TOTP secret
  // ... verify success
})

test('Login with MFA', async ({ page }) => {
  // full login + MFA
})

test('Use backup code', async ({ page }) => { /* ... */ })
test('Revoke trusted device', async ({ page }) => { /* ... */ })
```

---

## 18. Edge Cases

| الحالة | السلوك المطلوب |
|--------|-----------------|
| المستخدم يدخل كود في نهاية window (29 ثانية) | accept + log warning |
| Server time drift > 30s | reject + alert ops |
| Database down أثناء enroll | rollback + show error + retry |
| المستخدم يفقد phone قبل حفظ backup codes | recovery flow only option |
| Admin يحاول reset MFA لنفسه | reject — must be done by another super admin |
| Race condition: multiple devices enroll same time | last write wins + invalidate others |
| User has 100+ trusted devices | UI paginate + warn at 50 |
| Backup codes regenerated بعد استخدام بعضها | invalidate old batch entirely |
| SMS service down | fallback to email + log incident |
| User's email changed بعد enrollment | re-confirm via current MFA |
| Token used at exactly the boundary (30.000s) | accept (within tolerance) |
| Multiple backup codes used in 1 minute | suspicious — alert admin |
| User in airplane (offline TOTP works) | works (TOTP is offline-capable) |
| Clock change (DST) | handled correctly (UTC always) |
| User regenerates secret while logged in elsewhere | other sessions force re-MFA |

---

**نهاية مواصفات النقص #1**

> **الإحصائيات:**
> - 8 سيناريوهات
> - 7 جداول schema
> - 8 forms (40+ fields)
> - 5 grids (60+ columns)
> - 30 button
> - 10 dashboards/widgets
> - 11 notification types
> - 25+ unit tests
> - 18 edge cases
