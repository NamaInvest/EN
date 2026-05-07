# 04 — الفجوات السعودية (Saudi Compliance)

> **88 فجوة** على مستوى الامتثال للجهات الحكومية السعودية.
> **خطر:** غرامات حتى **5,000,000 ر.س** سنوياً (PDPL) + **تعليق الخدمات** (Qiwa/Mudad) + **رفض الفواتير** (ZATCA).
> الترتيب: P0 (16 بند) ثم P1 (39 بند) ثم P2 (33 بند).

---

# 🔴 P0 — حرج (Mandatory + Active Risk)

## SA-P0-01 · ZATCA Invoice Type Code Tagging — تصنيف نوع الفاتورة

**الجهة:** ZATCA | **الإلزام:** M | **الغرامة:** 5,000–50,000 ر.س. لكل فاتورة + رفض clearance

**ما المطلوب:**
- محرك auto-classification يحدد InvoiceTypeCode (388 Standard أو Simplified):
  - **Standard (388 with subtype 0100000):** B2B with VAT > 0
  - **Simplified (388 with subtype 0200000):** B2C
- BT-3 enforcement حسب نوع العميل (vatNumber موجود = B2B)
- Lock بعد الإصدار

**جداول:**
```prisma
// extension on SalesInvoice
invoiceTypeCode String  // 388
invoiceSubtypeFunctionCode String  // 0100000 (Standard) | 0200000 (Simplified)
isBusinessTransaction Boolean
```

**فورمات/أزرار:**
- في إنشاء الفاتورة: dropdown auto-set من Customer.vatNumber
- شاشة Settings → ZATCA: قواعد التصنيف الافتراضية

**برومنت:**
```
/erp-build-feature zatca-invoice-typing

1. Extend SalesInvoice schema with invoiceTypeCode + invoiceSubtypeFunctionCode
2. Auto-determine logic:
   - if customer.vatNumber AND amount > 0 → 388/0100000 (Standard)
   - else → 388/0200000 (Simplified)
3. Lock fields after issuance (block update)
4. Update XML generator to emit correct codes
5. Block invoice if VAT customer detected but no vatNumber stored
```

**سيناريو:** مستخدم يبيع لشركة (VAT موجود) → Auto = Standard. يبيع لشخص بدون VAT → Auto = Simplified. يحاول تعديل بعد إصدار → blocked.

**فلو:**
```
Invoice POST → Logic: customer.hasVat? → set typeCode + subtype
    ↓
Generate XML with BT-3 = correct value
    ↓
Submit to ZATCA API
    ↓
On clearance: lock all fields
```

---

## SA-P0-02 · ZATCA PIH Chain Integrity Monitor — مراقبة سلسلة هاش الفواتير

**الجهة:** ZATCA | **الإلزام:** M | **الغرامة:** رفض كامل + إعادة onboarding

(غُطّي بالتفصيل الكامل في `02_GLOBAL_GAPS_P0_P1.md` → P0-14)

**برومنت سريع:**
```
/erp-build-feature zatca-chain-monitor

Schema: ZatcaChainMonitor + ZatcaPortalReconciliation
Cron يومي: يقارن ICVs المحلية مع portal، يكشف الـ gaps، يقفل الـ device عند كسر، ينبه CFO.
APIs: /api/zatca/health, /api/zatca/reconciliation/run, /api/zatca/recovery/:deviceId
Dashboard: cards per device بـ status (Healthy/Broken/Missing)
```

---

## SA-P0-03 · ZATCA Portal Reconciliation Report — مطابقة بوابة ZATCA

**الجهة:** ZATCA | **الإلزام:** M | **الغرامة:** 1% من قيمة الفاتورة لكل under-reported

**ما المطلوب:**
- مهمة يومية تقارن الفواتير المحلية مع Fatoora portal
- قائمة Missing/Orphan/Rejected
- طابور Auto-resubmit
- Daily reconciliation log table

**جداول:**
```prisma
model ZatcaPortalReconciliation {
  id        String @id @default(cuid())
  tenantId  String
  reconDate DateTime
  totalLocal Int
  totalPortal Int
  missing   Int[]
  orphan    Int[]
  rejected  Int[]
  resubmitQueue Int[]
  status    String  // OK | DISCREPANCY
}
```

**برومنت:**
```
/erp-build-feature zatca-portal-recon

1. Schema: ZatcaPortalReconciliation
2. Cron daily 02:00:
   - SELECT all submitted invoices last 24h locally
   - Call Fatoora portal API: list invoices last 24h
   - Diff: find missing/orphan/rejected
   - INSERT recon record
3. APIs: GET /api/zatca/recon, POST /api/zatca/recon/resubmit/:icv
4. Dashboard: badge with discrepancy count + drill down
5. Auto-resubmit الـ missing (re-call ZATCA API)
```

**سيناريو:** كل صباح، CFO يرى kpi في Dashboard "ZATCA Reconciliation: 47 invoices, 2 missing in portal" → drill-down → resubmit بزر واحد.

**فلو:** Cron 02:00 → fetch local + portal → diff → record → if discrepancy → email CFO + auto-queue resubmit.

---

## SA-P0-04 · ZATCA Credit/Debit Note Reasons — أسباب الإشعارات

**الجهة:** ZATCA | **الإلزام:** M | **الغرامة:** رفض clearance + VAT mismatch

**ما المطلوب:**
- Reason code lookup (BT-Reason: 1=Cancel, 2=Correction, 3=Return, 4=Discount...)
- Mandatory link from Credit Note → original Invoice UUID + ICV
- BG-2 Billing reference

**جداول:**
```prisma
model ZatcaCreditNoteReason {
  id          String @id @default(cuid())
  code        String   // 1, 2, 3, 4, ...
  description String
  arDescription String
  active      Boolean
}

// extension on SalesReturn / Credit Note
reasonCode    String
originalInvoiceUuid String
originalInvoiceIcv  Int
```

**برومنت:**
```
/erp-build-feature zatca-credit-note-reasons

1. Schema: ZatcaCreditNoteReason (seed 8 standard codes)
2. Extend SalesReturn with reasonCode + originalInvoiceUuid + originalInvoiceIcv
3. UI: dropdown reason code in Credit Note form
4. XML generator: emit BG-2 Billing reference + Reason
5. Block submission if missing reason or original ref
```

**سيناريو:** عميل يرجع بضاعة → موظف ينشئ Credit Note → mandatory dropdown "Reason: 3-Return" + original invoice picker → XML يصدر مع BG-2 → ZATCA يقبل.

---

## SA-P0-05 · ZATCA 6-Year Archival — أرشفة 6 سنوات

**الجهة:** ZATCA / VAT Implementing Regulations Art. 66 | **الإلزام:** M | **الغرامة:** 50,000 ر.س. + إعادة بناء التقييم الضريبي

**ما المطلوب:**
- Immutable archive (WORM semantics)
- 6-year retention enforcement
- Legal hold flag
- Auto-purge بعد retention
- Signed bundle (XML + PDF/A-3 + signature manifest)

**جداول:**
```prisma
model ZatcaArchive {
  id          String @id @default(cuid())
  tenantId    String
  invoiceId   String
  xmlContent  String   // immutable
  pdfA3Url    String   // immutable
  signatureManifest Json
  archivedAt  DateTime
  retentionUntil DateTime  // archivedAt + 6 years
  legalHold   Boolean @default(false)
  legalHoldReason String?
}
```

**برومنت:**
```
/erp-build-feature zatca-6yr-archive

1. Schema: ZatcaArchive
2. On invoice clearance success: archive XML + generate PDF/A-3 + signature manifest → INSERT ZatcaArchive
3. Storage: /archive/zatca/{tenant}/{year}/{month}/{invoiceId}.zip
4. Cron daily: scan retention expired AND no legal hold → optional purge
5. API: GET /api/zatca/archive/:invoiceId — re-download bundle
6. Block all delete operations on archive table
```

**سيناريو:** Auditor يطلب فاتورة من 2023 → استرجاع كامل بـ XML + PDF + signature.

---

## SA-P0-06 · National Address Verification (SPL/Wasel) — التحقق من العنوان

(غُطّي في `02_GLOBAL_GAPS_P0_P1.md` → P0-15)

---

## SA-P0-07 · Customer VAT Lookup (ZATCA Registry) — التحقق من رقم ضريبي

(غُطّي في P0-17 سابقاً)

---

## SA-P0-08 · GOSI Saudi/Non-Saudi Rate Engine — محرك معدلات GOSI

(غُطّي في P0-18)

---

## SA-P0-09 · SANED Unemployment Insurance — تأمين البطالة

(غُطّي في P0-19)

---

## SA-P0-10 · GOSI Wage Cap (45,000 SAR) Enforcement — سقف الأجر

**الجهة:** GOSI | **الإلزام:** M | **الغرامة:** Over/under contribution + غرامات

**ما المطلوب:**
- 45,000 SAR contributory wage ceiling
- Basic + housing allowance composition
- Housing capped at 25% of basic
- Auto-exclusion of non-contributory allowances

**برومنت:**
```
/erp-build-feature gosi-wage-cap

1. extend Employee with basicSalary + housingAllowance + otherAllowances
2. Compute contributoryWage = min(basicSalary + capped(housingAllowance, basicSalary*0.25), 45000)
3. apply cap في every payroll run
4. test: SAR salary 60K, housing 12K → contributory = 45000 (capped)
```

---

## SA-P0-11 · WPS Per-Bank SIF Library (9 banks) — مكتبة قوالب البنوك

**الجهة:** SAMA / Mudad | **الإلزام:** M | **الغرامة:** WPS Reject → Qiwa freeze

**ما المطلوب:**
- Bank-specific SIF templates للبنوك التسعة:
  - Al Rajhi (RajhiCash)
  - SNB (eCorp / مصرف الراجحي السابق NCB)
  - Riyad Bank (RiyadOnline)
  - ANB (CashPro)
  - BSF (Banque Saudi Fransi)
  - Albilad
  - Alinma
  - SAB (الأول سابقاً Saudi British)
  - GIB
- Header/Detail/Trailer per bank
- IBAN MOD-97 validation
- Bank routing config

**برومنت:**
```
/erp-build-feature wps-bank-templates

1. Schema: BankWpsTemplate
2. ابن 9 generators in src/lib/wps/{bankCode}.ts
3. Each generator يأخذ payroll batch → يولد file بصيغة البنك المحددة
4. IBAN validator MOD-97
5. UI: settings/wps/bank-templates للتعديل
6. POST /api/hr/wps/generate?bankCode=RAJHI
```

---

## SA-P0-12 · WPS Salary Discrepancy Report — تقرير اختلاف الراتب

**الجهة:** Mudad / MHRSD | **الإلزام:** M | **الغرامة:** Nitaqat downgrade + 10,000 SAR لكل عامل

**ما المطلوب:**
- Compare Qiwa contract salary vs paid salary
- Threshold alert
- Justification capture (deduction, leave WoP, late join)
- Monthly discrepancy report

**برومنت:**
```
/erp-build-feature wps-salary-discrepancy

1. Schema: WpsSalaryDiscrepancy { employeeId, period, qiwaSalary, paidSalary, variance, reason }
2. Run after payroll: compare against Employee.qiwaContractSalary
3. If variance > 5%: flag + require justification
4. Monthly report → Mudad submission
```

---

## SA-P0-13 · WPS IBAN Validation (MOD-97 + Bank Match) — تحقق IBAN

**الجهة:** SAMA / Mudad | **الإلزام:** M | **الغرامة:** Salary bounce → WPS fail

**ما المطلوب:**
- IBAN format SA + 22 digits
- MOD-97 checksum
- Bank-name cross-check against IBAN BIC
- Account-holder name match

**برومنت:**
```
/erp-build-feature iban-validation

1. src/lib/iban-validator.ts:
   - validateFormat (SA + 22 digits)
   - validateMod97 (BBAN to mod 97 = 1)
   - extractBankCode (chars 4-7) → match BankCode
   - validateBankMatch
2. Hook into Employee/Vendor save
3. Block payroll/payment if invalid
```

---

## SA-P0-14 · Qiwa Contract Lifecycle (Issue/Amend/Terminate) — دورة عقد قوى

**الجهة:** MHRSD / Qiwa | **الإلزام:** M | **الغرامة:** 10,000 SAR per non-attested

**ما المطلوب:**
- Full state machine: issue → employee acceptance → amend → renew → terminate
- Qiwa-API integration per transition
- Attestation status tracking

**برومنت:**
```
/erp-build-feature qiwa-contract-lifecycle

1. Schema: extend QiwaContract with state machine + history
2. Qiwa API integration:
   - POST /api/saudi/qiwa/contracts/:id/issue
   - POST /api/saudi/qiwa/contracts/:id/amend
   - POST /api/saudi/qiwa/contracts/:id/terminate
3. Block hire/fire if contract not attested
4. UI: Contract timeline with state changes
```

---

## SA-P0-15 · Nitaqat Color Band Calculator — حاسبة نطاقات

(غُطّي في P0-20)

---

## SA-P0-16 · PDPL Consent + Cross-Border + Breach (3 components)

(غُطّي في P0-21 + P0-22)

**الإضافة هنا:** PDPL Breach Notification (72h)

**برومنت:**
```
/erp-build-feature pdpl-breach-72h

1. Schema: PdplBreach (موجود من P0-21)
2. Cron monitor: SLA timer من detectedAt → alert at 24h, 48h, 60h
3. SDAIA notification template (Arabic + English)
4. Subject notification workflow
5. Breach register page
```

---

# 🟠 P1 — High Priority (39 بند)

## SA-P1-01 · ZATCA Invoice Correction Workflow — تعديل قبل clearance
- State machine DRAFT → CLEARED مع نافذة تعديل قبل clearance
- Post-clearance lock + mandatory credit-note path
- `/erp-build-feature zatca-correction-window`

## SA-P1-02 · ZATCA Foreign Currency Conversion — تحويل العملات في الفواتير
- BT-6 (DocumentCurrencyCode) + BT-110 (TaxCurrencyCode SAR mandatory)
- SAMA daily rate cache + dual amount fields
- `/erp-build-feature zatca-fx-fields`

## SA-P1-03 · ZATCA B2C QR Code Field-Order Validation — التحقق من ترتيب QR
- TLV decoder + assert ordering and presence of tags 1–9
- Phase 2 signature tag
- `/erp-build-feature qr-validator`

## SA-P1-04 · ZATCA Self-Billed & Third-Party Invoice — أنواع متخصصة
- InvoiceTypeCode subtypes: 010 (self-billed), 100 (3rd-party), 200 (export), 400 (summary), 4000 (nominal)
- Separate numbering streams
- `/erp-build-feature zatca-special-invoices`

## SA-P1-05 · ZATCA Export Invoice Special Handling — فواتير التصدير
- Zero-rated tag + customs declaration + export reason
- `/erp-build-feature zatca-export-invoices`

## SA-P1-06 · Excise Tax Module — ضريبة انتقائية
- Excise goods (tobacco 100%, energy 100%, soft 50%, sweetened 50%, e-cig 100%)
- Excise warehouse register + monthly return + digital tax stamps
- `/erp-build-feature excise-tax-module`

## SA-P1-07 · Real Estate Transaction Tax (RETT) — ضريبة العقارات
- 5% RETT calculator + exemption matrix + RETT certificate + VAT exclusivity
- `/erp-build-feature rett-tax`

## SA-P1-08 · Customs Duty Calculator — حاسبة الجمارك
- GCC Common Tariff lookup by HS Code + CIF valuation + duty + VAT compounding + freight allocation
- `/erp-build-feature customs-duty-calculator`

## SA-P1-09 · Reverse Charge Mechanism (RCM) — الفرض العكسي
- Auto-detect imported services + RCM JE (DR Input VAT, CR Output VAT) + RCM box on VAT return
- `/erp-build-feature rcm-engine`

## SA-P1-10 · GOSI Annual Reconciliation — تسوية سنوية
- Year-end recon ERP vs portal + missed contributions + retro adjustments
- `/erp-build-feature gosi-annual-recon`

## SA-P1-11 · GOSI Disability/Occupational Injury — إصابات العمل
- Reporting form (within 3 days) + disability % tracking + compensation calc
- `/erp-build-feature gosi-occ-injury`

## SA-P1-12 · GOSI XML Bulk Upload File — ملف XML
- New hire / salary update / termination batch generators
- `/erp-build-feature gosi-xml-bulk`

## SA-P1-13 · WPS Compliance Certificate Tracker — شهادة الامتثال
- Monthly compliance cert from Mudad API + expiry alerts + Qiwa unlock
- `/erp-build-feature wps-cert-tracker`

## SA-P1-14 · WPS Late Salary Detection — تأخر الراتب
- Monitor: WPS run vs contractual due date, alert if > 3 days late
- `/erp-build-feature wps-late-salary`

## SA-P1-15 · Qiwa Wage Protection Certificate Sync — شهادة حماية الأجور
- Pull cert from Qiwa, embed in HR dashboard
- `/erp-build-feature qiwa-wp-cert-sync`

## SA-P1-16 · Qiwa Sponsorship Transfer (Naqal Kafala) — نقل كفالة
- Transfer-in/transfer-out workflow + employee consent + fee calc + MOL approval
- `/erp-build-feature qiwa-sponsorship-transfer`

## SA-P1-17 · Nitaqat Visa Quota Linkage — ربط بحصص التأشيرات
- Available quota per band + blocker if exhausted + nationality cap
- `/erp-build-feature nitaqat-visa-quota`

## SA-P1-18 · Nitaqat Projection / What-If Engine — محرك التوقع
- Simulator: project band after planned hires/terminations + weighted Saudi calc
- `/erp-build-feature nitaqat-whatif`

## SA-P1-19 · Female Employment Quota / Parallel Saudization — سعودة موازية
- Sector-specific female quota (e.g., retail 70%) + workplace rules
- `/erp-build-feature female-quota`

## SA-P1-20 · Sick Leave Engine (30/60/30) — إجازة مرضية
- 30 days full → 60 days @75% → 30 days unpaid + medical certificate workflow
- `/erp-build-feature sick-leave-engine`

## SA-P1-21 · Maternity Leave 10 Weeks + Iddah — أمومة وعدة
- 10-week maternity (4 pre + 6 post) + nursing breaks 24 months + Iddah leave
- `/erp-build-feature maternity-iddah`

## SA-P1-22 · Probation Period Contract — عقد الاختبار
- 90 days default, extendable to 180 with consent + no-EOS during probation + auto-conversion
- `/erp-build-feature probation-contract`

## SA-P1-23 · Notice Period Engine — فترة الإنذار
- Indefinite: 60 days monthly, 30 others; Definite: as agreed; Pay-in-lieu calc
- `/erp-build-feature notice-period-engine`

## SA-P1-24 · Annual Leave Tenure (21/30 Days) — إجازة سنوية
- Auto-uplift from 21 to 30 days at 5-year anniversary + encashment cap
- `/erp-build-feature annual-leave-tenure`

## SA-P1-25 · Overtime Calculation Engine — حاسبة الإضافي
- 1.5× regular, 2.0× holiday/Friday, max 720 OT hr/year + Ramadan reduced hours
- `/erp-build-feature overtime-engine`

## SA-P1-26 · Termination Reasons Catalog (Art. 80/81) — أسباب الإنهاء
- Art. 80 reasons (no EOS) + Art. 81 reasons (full EOS) + evidence repo + MoL workflow
- `/erp-build-feature termination-reasons`

## SA-P1-27 · Iqama/National ID Validity Check — تحقق الإقامة
- Iqama validity API (Absher Business) + National ID MOD-10 + employment-eligibility gate
- `/erp-build-feature iqama-validity`

## SA-P1-28 · Iqama Issuance & Renewal Tracker — تجديد الإقامة
- Issuance fee accrual + renewal schedule (650/1,000) + dependent fees (400/month) + exit-reentry
- `/erp-build-feature iqama-renewal-tracker`

## SA-P1-29 · Expat Levy / Dependent Fee — رسوم المرافقين
- Expat levy calc (800/700 per month) + dependent fee accrual + payroll deduction
- `/erp-build-feature expat-levy-engine`

## SA-P1-30 · Work Permit & Iqama Linkage — ربط رخصة العمل
- Work-permit vs Iqama vs Contract triple-tracker + renewal cost accruals + profession-match
- `/erp-build-feature permit-iqama-linkage`

## SA-P1-31 · PDPL Right to Erasure / Rectification — الحق في النسيان
- Hard-delete cascade + pseudo-anonymization for tax-retained data + 30-day SLA
- `/erp-build-feature pdpl-erasure`

## SA-P1-32 · PDPL Data Retention Policy Engine — احتفاظ البيانات
- Per-data-class retention period (HR 10y, ZATCA 6y, marketing 3y) + auto-purge + legal hold
- `/erp-build-feature pdpl-retention`

## SA-P1-33 · SOCPA Chart of Accounts Mapping — مخطط حسابات SOCPA
- SOCPA template + mapping to current CoA + Arabic captions
- `/erp-build-feature socpa-coa-template`

## SA-P1-34 · IFRS Disclosure Pack — حزمة إفصاحات IFRS
- Notes-to-financials generator + RPT + segments + IFRS 16/9/15 schedules
- `/erp-build-feature ifrs-disclosures`

## SA-P1-35 · AML / KYC / Sanctions Screening — مكافحة غسيل الأموال
- KYC tiering + UBO registry + transaction monitoring + sanctions daily + STR workflow
- `/erp-build-feature aml-kyc-engine`

## SA-P1-36 · Customs Bayan Integration — تكامل بيان الجمارك
- Bayan auto-pull + link to PO/GRN + duty + VAT posting + demurrage tracker
- `/erp-build-feature customs-bayan`

## SA-P1-37 · HS Code Master & Country of Origin — رمز جمركي
- HS Code (10-digit) + country origin + GCC origin certificate validator
- `/erp-build-feature hs-code-origin`

## SA-P1-38 · SABER / SASO Conformity — مطابقة المنتج
- SABER product registration + CoC + SC + regulated-products checklist
- `/erp-build-feature saber-conformity`

## SA-P1-39 · Per-Bank Payment File Formats (9 banks) — تنسيقات ملفات الدفع
- Bank-specific bulk-payment files (Al Rajhi, SNB, Riyad, ANB, BSF, Albilad, Alinma, SAB, GIB) + SARIE/Mada/SADAD references
- `/erp-build-feature bank-payment-formats`

---

# 🟡 P2 — Medium Priority (33 بند)

| # | الميزة | الجهة | البرومنت موجز |
|---|---|---|---|
| SA-P2-01 | VAT Group Registration | ZATCA | `/erp-build-feature vat-group` — single VAT reg covering multiple entities + intra-group elimination |
| SA-P2-02 | VAT Bad Debt Relief | ZATCA | `/erp-build-feature vat-bad-debt-relief` — recovery workflow ≥6 months overdue |
| SA-P2-03 | Hadaf Subsidy Tracking | HRDF | `/erp-build-feature hadaf-subsidy` — eligible Saudi registry + claim form + deferred income |
| SA-P2-04 | Self-Evaluation (Establishment) | Qiwa | `/erp-build-feature qiwa-self-evaluation` — annual self-assessment + evidence repo |
| SA-P2-05 | Mandoub Management | Qiwa | `/erp-build-feature qiwa-mandoub` — authorized signatory registry + delegation |
| SA-P2-06 | SAMA Reporting (FIs) | SAMA | `/erp-build-feature sama-reporting` — capital adequacy + liquidity + AML monitoring + STR |
| SA-P2-07 | CMA Disclosures (Listed) | CMA | `/erp-build-feature cma-disclosures` — board/exec disclosures + RPT + insider register + XBRL Tadawul |
| SA-P2-08 | Foreign Investment License (MISA) | MISA | `/erp-build-feature misa-license-tracker` — license + expiry + IKTVA commitments |
| SA-P2-09 | SFDA Drug Registry | SFDA | `/erp-build-feature sfda-drugs` — Saudi Drug Code per SKU + batch + expiry + RSD flag + recall |
| SA-P2-10 | Medical Device Serialization (RASEED) | SFDA | `/erp-build-feature sfda-devices` — UDI + traceability chain + SFDA portal sync |
| SA-P2-11 | Food Establishment / Halal | SFDA/GACA | `/erp-build-feature halal-food-compliance` — license + halal cert + recall + allergen labeling |
| SA-P2-12 | Civil Defense Safety | GDCD | `/erp-build-feature civil-defense-safety` — license + fire inspection + extinguisher log + drill log |
| SA-P2-13 | CR Renewal & Branch Sync | MoC | `/erp-build-feature cr-renewal-sync` — CR expiry + auto-renewal alert + branch sync + capital mod |
| SA-P2-14 | Chamber of Commerce Membership | Saudi Chambers | `/erp-build-feature chamber-membership` — membership renewal + CoO requests |
| SA-P2-15 | Yakeen Service Integration | NIC Yakeen | `/erp-build-feature yakeen-integration` — identity verification (basic/comprehensive/address) |
| SA-P2-16 | Address Standardization Pipeline | SPL/Wasel | `/erp-build-feature address-standardization` — normalization + fuzzy match + geocoding |
| SA-P2-17 | Etimad Tender Integration | MoF Etimad | `/erp-build-feature etimad-integration` — tender catalog + bid + performance bond + milestone billing |
| SA-P2-18 | SADAD Biller Integration | SAMA SADAD | `/erp-build-feature sadad-biller` — biller code + reference + payment confirmation webhook |
| SA-P2-19 | Mada / Apple Pay / STC Pay Reconciliation | SAMA | `/erp-build-feature mada-recon` — settlement file ingestion + MDR fee + chargeback workflow |
| SA-P2-20 | SARIE / RTGS Wire | SAMA SARIE | `/erp-build-feature sarie-wire` — MT103-equivalent + IBAN check + large-value audit |
| SA-P2-21 | Hijri Calendar Engine (covered P0-16) | — | covered |
| SA-P2-22 | Government Fees Master | Multiple | `/erp-build-feature gov-fees-master` — master list of fees + accrual + prepaid module |
| SA-P2-23 | Arabic Numerals & RTL Documents | General | `/erp-build-feature arabic-numerals-rtl` — Hindi-Arabic option + RTL PDF + bilingual templates |
| SA-P2-24 | NCDC e-Signature Integration | NCDC | `/erp-build-feature ncdc-pki` — Saudi CA integration + qualified e-signature |
| SA-P2-25 | Zakat Hijri-Year Option | ZATCA | `/erp-build-feature zakat-hijri-year` — Hijri vs Gregorian fiscal year + Zakat base recalc |
| SA-P2-26 | Government Holidays Calendar | MHRSD | `/erp-build-feature ksa-holidays-calendar` — Hijri + national days + payroll OT × 2.0 |
| SA-P2-27 | Subcontractor Compliance | MoC/MISA | `/erp-build-feature subcontractor-compliance` — sub CR + VAT validation + WHT trigger |
| SA-P2-28 | NAFITH Logistics | TGA | `/erp-build-feature nafith-waybill` — waybill issuance + driver/vehicle reg + Bayan link |
| SA-P2-29 | Tourism Sector Compliance | MoT | `/erp-build-feature tourism-compliance` — license + Sharik portal + hotel-rate-tax 5% |
| SA-P2-30 | Hajj Leave Register | MHRSD | `/erp-build-feature hajj-leave` — once-per-service register (10–15 days, after 2 yrs) |
| SA-P2-31 | DPO Registry | SDAIA | `/erp-build-feature pdpl-dpo-registry` — DPO registration + RoPA + DPIA |
| SA-P2-32 | National Insurance Card / Insurance Premium | NCCI | `/erp-build-feature insurance-premium-engine` — CCHI premium per employee + dependent + recharge |
| SA-P2-33 | Muqeem Iqama-Issuance Workflow | MOI Muqeem | `/erp-build-feature muqeem-issuance-workflow` — issuance fee accrual + renewal schedule (covered P1-28) |

---

# الملخص

| الأولوية | العدد | الإلزام |
|---|---:|---|
| P0 | 16 | 16 Mandatory + غرامات نشطة |
| P1 | 39 | 35 Mandatory + 4 Recommended |
| P2 | 33 | 22 Mandatory + 11 Recommended |
| **الإجمالي** | **88** | **73 إلزامية** |

**أعلى الأولويات للتنفيذ الفوري (Top 10 P0):**

1. SA-P0-02: ZATCA PIH Chain Monitor (يقفل النظام عند الكسر)
2. SA-P0-03: ZATCA Portal Reconciliation (1% per under-reported)
3. SA-P0-11: WPS Bank Templates (Qiwa freeze on fail)
4. SA-P0-13: IBAN Validation
5. SA-P0-15: Nitaqat Color Band Calculator
6. SA-P0-16: PDPL Consent + Breach Notification (5M SAR fines)
7. SA-P0-06: SPL Address Verification (ZATCA invoice block)
8. SA-P0-07: ZATCA VAT Lookup
9. SA-P0-01: ZATCA Invoice Type Code
10. SA-P0-14: Qiwa Contract Lifecycle

**كيف تستخدم هذا الملف:**

```
1. اختر بنداً
2. انسخ البرومنت
3. الصقه في chat جديد (مع أو بدون مرجع لهذا الملف)
4. سأبني الميزة (Schema + APIs + Frontend + Tests + Compliance Validation)

ملاحظة: P0 السعودية تتقدم على P0 العالمية إلا إذا كان البند العالمي يفتح ميزة سعودية.
```

→ تابع في `05_ROADMAP.md` للترتيب الزمني المقترح.
