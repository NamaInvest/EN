# G5 — Legal & Compliance Docs

## الحالة الحالية
- `docs/MASTER_PACK/23-legal/` (1 ملف فقط)
- `.ai-brain/15-saudi-compliance.md` (الامتثال السعودي)
- PDPL Articles 1-44 مُطبّقة في الكود
- لا OEM templates نهائية للعقود

## الفجوة (مقابل SAP Global Compliance Cloud)
- لا Terms of Service رسمية
- لا Privacy Policy منشورة
- لا DPA (Data Processing Agreement) للـ enterprise
- لا EULA للديسكتوب
- لا SLA tiers موثقة

## 🎯 Ready Prompt

```
المهمة: حزمة قانونية كاملة جاهزة للنشر.

السياق:
- منتج: SaaS ERP + Desktop app
- جغرافياً: السعودية أساساً، الخليج ثانوياً
- قانونياً: PDPL (السعودي), GDPR (اختياري للعملاء الأجانب), VAT, ZATCA
- محامي مطلوب للمراجعة النهائية

المخرجات:
1) Legal pack (ar + en for each):
   docs/MASTER_PACK/23-legal/

   ├── terms-of-service.ar.md          (شروط الخدمة)
   ├── terms-of-service.en.md
   ├── privacy-policy.ar.md            (سياسة الخصوصية — PDPL Articles 1-44)
   ├── privacy-policy.en.md
   ├── data-processing-agreement.ar.md (DPA enterprise)
   ├── data-processing-agreement.en.md
   ├── eula-desktop.ar.md              (Electron license)
   ├── eula-desktop.en.md
   ├── sla-tiers.md                    (SLA per Free/Pro/Enterprise)
   ├── acceptable-use-policy.ar.md
   ├── acceptable-use-policy.en.md
   ├── cookie-policy.ar.md
   ├── cookie-policy.en.md
   ├── breach-notification-procedure.md (72h PDPL + GDPR)
   ├── refund-policy.ar.md
   ├── refund-policy.en.md
   ├── reseller-agreement.md
   └── api-terms.md                    (للـ B2B integrations)

2) Compliance matrices:
   docs/MASTER_PACK/23-legal/compliance/

   ├── pdpl-compliance.md
   │   - كل من 44 article مع status + evidence
   │   - مثال: Article 12 (30-day DSR response) → /compliance/pdpl/dsr page
   │
   ├── gdpr-compliance.md
   │   - Articles 5-32 (الأكثر صلة)
   │   - Mapping with PDPL where overlap
   │
   ├── zatca-compliance.md
   │   - Phase 2 requirements
   │   - 6-year retention proof
   │   - XML signing implementation
   │
   ├── socpa-compliance.md
   │   - Chart of accounts compliance
   │   - Audit trail requirements
   │
   ├── gosi-compliance.md
   │   - Article 5 (employee registration)
   │   - Contribution calculation
   │
   └── saudi-labor-law-compliance.md
       - EOS calculation (Article 84-85)
       - WPS implementation
       - Mudad integration

3) Legal pages (in-app):
   src/app/legal/page.tsx (index)
   src/app/legal/terms/page.tsx
   src/app/legal/privacy/page.tsx
   src/app/legal/dpa/page.tsx
   src/app/legal/cookies/page.tsx
   - Render from docs/MASTER_PACK/23-legal/*.md (using react-markdown)
   - Version visible at footer
   - Last updated date
   - Print-friendly

4) Consent management:
   src/components/CookieConsent.tsx:
   - On first visit: shows banner
   - Granular: essential | analytics | marketing
   - Stored: PdplConsent table (already exists!)
   - PDPL Article 8 compliance

   src/app/legal/dsr-request/page.tsx:
   - Public form for non-users to request:
     - Data access
     - Data deletion
     - Data portability
   - Creates PdplDataSubjectRequest record
   - Notifies DPO

5) Terms acceptance tracking:
   prisma model:
   ```
   model UserAgreement {
     id Int @id
     userId Int
     agreementType String  // 'tos' | 'privacy' | 'cookies' | 'dpa'
     version String        // 'v2.1'
     acceptedAt DateTime
     ipAddress String
     userAgent String
   }
   ```
   On terms update → force re-acceptance from all users

6) Audit + retention:
   docs/MASTER_PACK/23-legal/RETENTION_POLICY.md:
   - Financial records: 7 years (ZATCA)
   - Audit logs: 7 years
   - Employee records: 7 years post-termination (Saudi labor)
   - Customer PII: while active + 1 year
   - Marketing data: 2 years
   - Application logs: 90 days
   - Implement via scripts/cron/retention-cleanup.ts

7) Trust Center page:
   src/app/trust/page.tsx (public):
   - List all certifications (SOC 2, ISO 27001, when achieved)
   - Compliance with PDPL/GDPR statements
   - Security practices summary
   - Incident history (transparent)
   - Subprocessors list (Vercel, Hetzner, Cloudflare, etc.)
   - Contact for compliance inquiries

8) Subprocessor list:
   docs/MASTER_PACK/23-legal/subprocessors.md:
   - Hetzner (hosting)
   - Cloudflare (DNS + WAF)
   - Google (Gemini AI)
   - Resend or SendGrid (email)
   - Bunny CDN (videos)
   - Sentry (error tracking)
   - PDPL Article 29: notify customers if subprocessor changes

القيود:
- **يجب مراجعة محامي قبل النشر النهائي**
- backward compat: users على versions قديمة يُذكَّرون
- breach notification: 72h max (PDPL + GDPR strict)
- DPA available on request للـ Enterprise customers
```

## السيناريو

عميل enterprise كبير (شركة سعودية + 100 موظف) يريد التعاقد:

**أسبوع 1 — Initial inquiry**:
1. Sales sends Trust Center link
2. عميل يقرأ certifications + compliance statements
3. Legal team من جهة عميل تطلب DPA

**أسبوع 2 — DPA negotiation**:
4. PM يفتح `docs/MASTER_PACK/23-legal/data-processing-agreement.ar.md`
5. Sends standard DPA to customer
6. Customer legal review → suggests 3 minor edits
7. PM negotiates → final draft
8. Both sides sign

**أسبوع 3 — Contract**:
9. ToS + Privacy + DPA all signed
10. UserAgreement records created
11. Account provisioned
12. Welcome email + onboarding

**3 أشهر لاحقاً — Breach happens**:
13. SIEM detects unauthorized data access attempt
14. IR Lead activates `IR_PLAN.md`
15. Investigation: PII for 50 customers exposed
16. **72-hour clock starts**:
    - Hour 1-12: contain + investigate
    - Hour 13-48: identify scope + impact
    - Hour 49-72: notify SDAIA (PDPL Art 20)
    - Notify affected customers
17. Use `breach-notification-procedure.md` template
18. PdplBreachIncident logged in /compliance/pdpl/breaches
19. Post-mortem published in Trust Center

## Data Flow

```
[Terms acceptance flow]
New user signs up
   ↓
Sign-up page shows:
   ☐ I accept Terms of Service (link)
   ☐ I accept Privacy Policy (link)
   ☐ I accept Cookie Policy (link)
   ↓
On click "Create Account":
   - Store UserAgreement record for each
     { userId, agreementType, version, acceptedAt, ip, ua }
   ↓
Account created
   ↓
Welcome email includes all policy versions

[Policy update flow]
Legal updates docs/MASTER_PACK/23-legal/privacy-policy.ar.md
   ↓
PR opened
   ↓
On merge:
   - version bumped (v2.0 → v2.1)
   - all users marked: re-acceptance required
   ↓
Next login: user sees "Updated privacy policy"
   - Diff displayed
   - Re-accept or logout
   ↓
New UserAgreement record stored

[DSR request flow]
Public user (no account) visits /legal/dsr-request
   ↓
Fills form:
   - Email/phone
   - Request type (ACCESS | ERASE | RECTIFY)
   - Description
   ↓
POST /api/public/dsr-request
   ↓
Verify email via OTP (prevent abuse)
   ↓
Create PdplDataSubjectRequest record
   ↓
Notify DPO via email
   ↓
DPO sees request in /compliance/pdpl/dsr
   ↓
30-day countdown starts
   ↓
DPO fulfills (manually or auto)
   ↓
Email back to user with results

[Retention cleanup flow]
Daily cron @ 03:00
   ↓
scripts/cron/retention-cleanup.ts
   ↓
For each data type with retention policy:
   - Find records older than retention period
   - For financial: archive to Glacier
   - For PII: anonymize
   - For logs: delete
   ↓
Audit log every action
   ↓
Slack summary
```

## ملفات المُنتَج

- `docs/MASTER_PACK/23-legal/*.{ar,en}.md` × ~17 files
- `docs/MASTER_PACK/23-legal/compliance/*.md` × 6
- `docs/MASTER_PACK/23-legal/RETENTION_POLICY.md`
- `docs/MASTER_PACK/23-legal/subprocessors.md`
- `src/app/legal/*/page.tsx` × ~6
- `src/app/trust/page.tsx` (public)
- `src/app/legal/dsr-request/page.tsx` (public)
- `src/components/CookieConsent.tsx`
- `prisma/schema.prisma` — UserAgreement model (new)
- `scripts/cron/retention-cleanup.ts`
