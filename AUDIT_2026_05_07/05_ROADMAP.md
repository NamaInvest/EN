# 05 — خارطة الطريق المقترحة (12 شهر)

> ترتيب التنفيذ بناءً على: المخاطر السعودية → الأثر التشغيلي → الأكثر طلباً.
> اعتبر فريقك = 4 مطورين بدوام كامل + Tech Lead.
> الفترة: مايو 2026 → أبريل 2027.

---

## مبدأ الترتيب

1. **سد فجوات Compliance السعودية P0 أولاً** — لأن لها غرامات نشطة.
2. **اربط الـ stubs الموجودة بالـ APIs الموجودة** — هذا يعطي أكبر قيمة بأقل جهد.
3. **ابن أهم 7 ميزات P0 العالمية** — الميزات التنفيذية (CFO, AP, ATP).
4. **P1 على دفعات شهرية**.
5. **P2/P3 حسب الطلب من العملاء أو المنافسة**.

---

## الجدول الزمني المقترح

### الشهر 1 (مايو 2026) — P0 السعودية الحرجة

**الهدف:** إغلاق المخاطر القانونية النشطة.

| الأسبوع | المهمة | البرومنت |
|---|---|---|
| 1 | SA-P0-02: ZATCA PIH Chain Integrity Monitor | `/erp-build-feature zatca-chain-monitor` |
| 1 | SA-P0-03: ZATCA Portal Reconciliation | `/erp-build-feature zatca-portal-recon` |
| 2 | SA-P0-11: WPS Bank Templates (9 banks) | `/erp-build-feature wps-bank-templates` |
| 2 | SA-P0-13: IBAN Validation MOD-97 | `/erp-build-feature iban-validation` |
| 3 | SA-P0-15: Nitaqat Color Band Calculator | `/erp-build-feature nitaqat-engine` |
| 3 | SA-P0-06: SPL Address Verification | `/erp-build-feature spl-address-verify` |
| 4 | SA-P0-16: PDPL Consent + Breach Notification | `/erp-build-feature pdpl-consent` + `/erp-build-feature pdpl-breach-72h` |
| 4 | SA-P0-07: ZATCA VAT Lookup | `/erp-build-feature zatca-vat-lookup` |

**المخرجات:** غرامات ZATCA/WPS/PDPL محصورة. النظام لا يصدر فاتورة ضائعة. لا يحاول دفع راتب لـ IBAN خاطئ.

---

### الشهر 2 (يونيو 2026) — أكمل P0 السعودية + ابدأ Frontend Backlog

| الأسبوع | المهمة |
|---|---|
| 1 | SA-P0-01: ZATCA Invoice Type Code Tagging |
| 1 | SA-P0-04: ZATCA Credit/Debit Note Reasons |
| 2 | SA-P0-05: ZATCA 6-Year Archival |
| 2 | SA-P0-14: Qiwa Contract Lifecycle |
| 3 | SA-P0-08: GOSI Saudi/Non-Saudi Rate Engine |
| 3 | SA-P0-09: SANED Unemployment Insurance |
| 4 | SA-P0-10: GOSI Wage Cap (45,000) |
| 4 | SA-P0-12: WPS Salary Discrepancy Report |

**المخرجات:** 16/16 من P0 السعودية مكتملة.

---

### الشهر 3 (يوليو 2026) — Frontend Stubs الكبيرة

**الهدف:** إيقاف الهدر — 206 صفحة Stub، APIs موجودة. اربطها.

> أولوية: الصفحات الأكثر استخداماً يومياً.

**المهام (تستهدف 50 صفحة):**
- 12 صفحة Manufacturing stubs (capacity, scrap, oee, scheduler, kanban, ...) → اربطها بالـ APIs الموجودة.
- 8 صفحات Finance stubs (fx-revaluation, wht, consolidation, copa, period-close, balance-sheet, ...) → APIs موجودة وكاملة.
- 6 صفحات HR stubs (eos, recruitment, training, ai-enrollment, performance, self-service) → الكثير منها له APIs.
- 10 صفحات v3 Distribution/Real Estate/Restaurant — اربطها بالـ V3 APIs (تحتاج إكمال APIs أولاً).
- 14 صفحة miscellaneous (reports/zatca-vat, reports/segments, expenses, audit-logs, ...).

**النتيجة المتوقعة:** عدد الصفحات READY يقفز من 68 إلى ~118.

---

### الشهر 4 (أغسطس 2026) — P0 العالمية الأهم

| الأسبوع | المهمة |
|---|---|
| 1 | P0-07: Field-Level Audit Trail (يفعّل في كل الـ APIs الحرجة) |
| 1-2 | P0-08: Universal Approval Engine |
| 2-3 | P0-04: AP Invoice Capture (OCR + AI Match) |
| 3-4 | P0-10: Real-Time Credit Check at Order Entry |
| 4 | P0-09: Customer Hierarchy (Sold-to/Ship-to/Bill-to/Payer) |

---

### الشهر 5 (سبتمبر 2026) — P0 المالية الأساسية

| الأسبوع | المهمة |
|---|---|
| 1-2 | P0-01: Cash Position & Liquidity Planning (13-week forecast) |
| 2-3 | P0-11: Period Close Cockpit |
| 3-4 | P0-13: Saudi Statutory Reports Pack (Zakat + VAT Return + WHT Return) |

---

### الشهر 6 (أكتوبر 2026) — P0 Manufacturing + Group Reporting

| الأسبوع | المهمة |
|---|---|
| 1-2 | P0-05: Shop Floor Operator Terminal (MES) |
| 3-4 | P0-02: Group Reporting / IFRS Consolidation Engine |

---

### الشهر 7 (نوفمبر 2026) — P0 ATP + Hijri + xP&A

| الأسبوع | المهمة |
|---|---|
| 1 | P0-03: ATP at Order Entry |
| 1 | P0-16: Hijri Calendar Engine |
| 2-4 | P0-06: Planning & Budgeting xP&A |

**المخرجات:** كل P0 العالمية + كل P0 السعودية مكتملة. المنتج وصل لمستوى **enterprise-grade للسوق السعودي**.

---

### الأشهر 8-9 (ديسمبر 2026 + يناير 2027) — P1 المالية + المخزون + التصنيع

**الموجة 1 (62 بند P1، 36 بند P1 سعودي = 98 بند). نختار 24 بنداً P1.**

| الأسبوع | المهمة |
|---|---|
| 1 | P1-09: Plant Maintenance / EAM |
| 1 | P1-30: Manufacturing Capacity Leveling |
| 2 | P1-25: Goods Receipt Quality Hold |
| 2 | P1-26: Blanket PO / Scheduling Agreements |
| 3 | P1-27: Subcontracting (Toll Mfg) |
| 3 | SA-P1-06: Excise Tax Module |
| 4 | SA-P1-08: Customs Duty Calculator |
| 4 | SA-P1-09: Reverse Charge Mechanism |
| 5 | P1-31: Account Reconciliation Automation |
| 5 | P1-32: Lease Abstraction & IFRS 16 Lessee Full |
| 6 | P1-33: Cash Flow Statement (IAS 7) |
| 6 | P1-34: AR Cash Application with ML |
| 7 | P1-35: AR Collections Strategy |
| 7 | P1-36: AP Payables Hub |
| 8 | P1-37: AP Vendor Bank Validation Fraud Controls |

---

### الشهر 10 (فبراير 2027) — P1 HR + الموظف + Compliance

| الأسبوع | المهمة |
|---|---|
| 1 | P1-13: Compensation Management |
| 1 | SA-P1-20: Sick Leave Engine (30/60/30) |
| 2 | SA-P1-21: Maternity + Iddah |
| 2 | SA-P1-22: Probation Period |
| 3 | SA-P1-23: Notice Period Engine |
| 3 | SA-P1-24: Annual Leave Tenure |
| 4 | SA-P1-25: Overtime Engine |
| 4 | SA-P1-26: Termination Reasons |

---

### الشهر 11 (مارس 2027) — P1 Service + CRM + Reporting

| الأسبوع | المهمة |
|---|---|
| 1 | P1-10: Quality Management Full (AQL + SPC + CAPA) |
| 1 | P1-11: Field Service Management |
| 2 | P1-12: Service Contracts & Entitlements |
| 2 | P1-19: Embedded BI / Pre-built Analytics |
| 3 | P1-58: ZATCA Phase 2 Buyer-Side (Inbound Clearance) |
| 3 | SA-P1-35: AML / KYC / Sanctions Screening |
| 4 | P1-46: Customer 360 Screen |
| 4 | P1-47: EVM Projects |

---

### الشهر 12 (أبريل 2027) — P1 الأخيرة + بدء P2

| الأسبوع | المهمة |
|---|---|
| 1 | P1-50: Auto-Reversal of Accruals |
| 1 | P1-51: Recurring Journal Templates |
| 2 | P1-56: Master Data Duplicate Detection |
| 2 | P1-57: Master Data Approval Workflow |
| 3 | P1-61: Segregation of Duties (SoD) |
| 3 | P1-62: Mobile Executive Dashboards |
| 4 | بدء P2 حسب الطلب |

---

## مخرجات نهاية السنة

بعد 12 شهراً متوقع:

| المقياس | اليوم | بعد 12 شهر |
|---|---:|---:|
| Pages READY | 68 | ~140 |
| Pages PARTIAL | 92 | ~50 |
| Pages STUB | 206 | ~80 (الـ V3 verticals لم تُكمل) |
| API READY | 480 | ~620 |
| Saudi Compliance P0 | 0/16 | 16/16 |
| Saudi Compliance P1 | 0/39 | ~30/39 |
| Global P0 | 0/22 | 22/22 |
| Global P1 | 0/62 | ~25/62 |

**القدرة التنافسية المتوقعة:**
- منافس مباشر لـ **Odoo 18 Enterprise** في السوق السعودي.
- عند 80% من **NetSuite** للـ mid-market.
- 50-60% من **SAP S/4HANA** للـ enterprise.

---

## بدائل: مسارات أسرع

### المسار "Compliance First" (3 شهور)
لو هدفك حصراً سد المخاطر: انه P0 السعودية + Field Audit Trail + Approval Engine في 3 شهور.

### المسار "Sales First" (3 شهور)
لو هدفك جذب عملاء: P0-03 ATP + P0-04 AP Capture + P0-08 Approvals + 50 صفحة stub أهم.

### المسار "CFO First" (4 شهور)
لو هدفك العميل المالي: P0-01 Cash Position + P0-02 Group Reporting + P0-06 xP&A + P0-11 Period Close + P0-13 Statutory Reports.

---

## كيف تنفّذ كل بند

```bash
# 1. افتح ملف البرومنت
cat AUDIT_2026_05_07/02_GLOBAL_GAPS_P0_P1.md  # للـ P0/P1
cat AUDIT_2026_05_07/04_SAUDI_GAPS.md          # للسعودية

# 2. انسخ البرومنت من البند المختار

# 3. ابدأ chat جديد مع Claude:
"اقرأ d:/namasoft9-3-main/AUDIT_2026_05_07/02_GLOBAL_GAPS_P0_P1.md"
"نفّذ البند P0-04 (AP Invoice Capture) كاملاً"

# 4. Claude:
- يقرأ المرجع
- يستخدم الـ subagent erp-architect لمراجعة التصميم
- يكتب Schema migration
- يكتب APIs مع auto-journal
- يكتب Frontend
- يكتب Tests
- يعرض Diff للموافقة
```

---

## مؤشرات النجاح

في كل شهر، تتبع:

1. **Pages READY count** — ينمو بمعدل 7-10/شهر.
2. **Saudi Compliance Coverage %** — يصل 100% في الشهر 7.
3. **API Coverage %** — يصل 96%.
4. **Customer Tickets** — ينخفض كلما زاد READY.
5. **Audit Findings** — صفر بعد الشهر 4.

---

## Risks & Mitigation

| المخاطرة | التخفيف |
|---|---|
| تغيير ZATCA spec | احرص على abstract layer + Phase 3 prep |
| تغيير GOSI rates | config-driven في Settings |
| Performance على 1000+ tenants | Database sharding plan في Q3 |
| فقدان مطور | وثّق كل ميزة في README الموديول |
| Customer requests for P3 features | اشرح الترتيب وقدم timeline |

---

## ختام

هذا الفحص يحتوي:
- **آخر تشخيص رقمي** للوضع الراهن.
- **250 فجوة محددة** مع برومنت + سيناريو + فلو.
- **خارطة طريق 12 شهر** قابلة للتنفيذ مع 4 مطورين.
- **بدائل مرنة** حسب الأولويات التجارية.

**القاعدة الذهبية في التنفيذ:**
> اقرأ الفلو، استشر المحاسب (subagent: accounting-validator)، اكتب الـ test، ثم اكتب الكود.

**عند البدء بأي ميزة:**
1. ارجع للملف المعني (02/03/04).
2. انسخ البرومنت.
3. ابدأ chat بـ /erp-build-feature [name].
4. تأكد من اختبار في sandbox قبل production.
5. وثّق في README الموديول.

---

**نهاية فحص 2026-05-07**
