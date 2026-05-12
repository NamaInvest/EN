---
version: 1.0
last_updated: 2026-05-12
---

# Test Plan & Test Cases

> خطة الاختبار الشاملة + حالات اختبار محددة لكل موديول.

## نطاق الاختبار

### In-scope
- جميع الـ APIs (823 route)
- جميع الـ engines (358)
- 50 critical user journeys (E2E)
- Performance + Load
- Security (OWASP Top 10)
- Accessibility (WCAG 2.1 AA)
- ZATCA compliance scenarios
- Multi-tenant isolation
- Data migration accuracy

### Out-of-scope (للنسخة الحالية)
- iOS/Android native (separate stream)
- Stress test > 10K concurrent (planned for v2)
- Penetration test (external vendor)

## استراتيجية الاختبار

```
Smoke (2 min)         → كل deploy
Regression (15 min)   → كل PR merge to develop
Full Suite (45 min)   → nightly on develop
Performance (2 hr)    → weekly on staging
Security (4 hr)       → before each production release
ZATCA E2E (30 min)    → daily on sandbox
```

## Critical User Journeys (50 E2E tests)

### Finance & Accounting (12)
1. JE-001: إنشاء قيد يدوي متوازن
2. JE-002: قيد غير متوازن — رفض
3. JE-003: قيد على حساب رقابي — رفض
4. JE-004: قيد على فترة مقفلة — رفض
5. JE-005: عكس قيد POSTED — قبول
6. PC-001: إقفال شهر كامل
7. PC-002: إقفال مع banks غير مسوّاة — رفض
8. TB-001: ميزان مراجعة بصفر
9. FS-001: قائمة الدخل + الميزانية + التدفقات
10. AL-001: تخصيص تكاليف بطريقة Step-Down
11. FX-001: إعادة تقييم العملات الأجنبية
12. CONS-001: توحيد شركتين مع eliminations

### Sales (10)
13. SI-001: إنشاء فاتورة + تخفيض المخزون + قيد كامل
14. SI-002: فاتورة مع تجاوز حد الائتمان — رفض
15. SI-003: مرتجع كامل لفاتورة
16. SI-004: مرتجع جزئي مع credit note
17. ZAT-001: ZATCA clearance ناجح
18. ZAT-002: ZATCA failure + retry
19. POS-001: عملية بيع كاش POS
20. POS-002: عملية بيع بطاقة POS + settlement
21. QUOTE-001: عرض سعر → موافقة → طلب → تسليم → فاتورة
22. PRICE-001: تطبيق pricelist عميل + خصم تلقائي

### Procurement (8)
23. PR-001: طلب شراء → موافقة → PO
24. PO-001: ASN من المورد → GRN → فاتورة → 3-way match → AP
25. 3WM-001: مطابقة ضمن tolerance
26. 3WM-002: مطابقة خارج tolerance — held
27. VENDOR-001: vendor onboarding كامل
28. PAY-RUN-001: دفعة جماعية للموردين عبر SARIE
29. CONTRACT-001: blanket PO + releases
30. RFQ-001: RFQ بـ 3 موردين + comparison

### Inventory (6)
31. STOCK-001: تحويل مخزون بين فروع
32. STOCK-002: stocktake مع variance
33. FIFO-001: تكلفة FIFO عند الإصدار
34. WAC-001: تكلفة WAC عند الإصدار
35. WMS-001: wave picking كامل
36. BATCH-001: تتبع batch + expiry alerts

### Manufacturing (5)
37. MO-001: MO من start إلى completion
38. BOM-001: BOM متعدد المستويات
39. MRP-001: MRP run + suggestions
40. QC-001: quality inspection failed → quarantine
41. VAR-001: variance analysis (material/labor/overhead)

### HR & Payroll (5)
42. PAY-001: payroll run شهري
43. WPS-001: SIF file generation + validate
44. GOSI-001: GOSI calculation + monthly file
45. EOS-001: end-of-service calculation
46. LEAVE-001: leave request → approval → balance update

### Cross-cutting (4)
47. TENANT-001: tenant isolation (cannot access other tenant data)
48. PERM-001: role-based access (sales rep cannot see GL)
49. AUDIT-001: every write logged in field-audit
50. BACKUP-001: tenant export + restore

## Test Cases Detailed (Sample)

### TC-SI-001: إنشاء فاتورة كاملة

| ID | TC-SI-001 |
|---|---|
| **Title** | إنشاء فاتورة مبيعات وتسجيل القيد |
| **Priority** | High |
| **Type** | Functional / Integration |
| **Module** | Sales |

#### Preconditions
- Tenant configured with COA (SOCPA template)
- Customer "ABC Trading" with credit limit 50,000 SAR, balance 0
- Product "P-001" with cost 30 SAR, price 100 SAR, stock 100 units
- VAT rate 15% configured
- Payment terms "Net 30" configured

#### Steps
1. Login as sales rep
2. Navigate to `/sales/invoices/new`
3. Select customer "ABC Trading"
4. Set date = today
5. Add line: P-001, qty=10, unit_price=100
6. Verify subtotal = 1000, VAT = 150, total = 1150
7. Click "Save"

#### Expected Results
- Invoice created with code matching format `INV-YYYY-MM-NNNN`
- Status = "POSTED"
- Grand total = 1150.00 SAR
- Journal entry exists with lines:
  - AR DR 1150.00
  - Revenue CR 1000.00
  - VAT Output CR 150.00
  - COGS DR 300.00
  - Inventory CR 300.00
- Σ DR = Σ CR = 1450.00
- Stock of P-001 = 90 (100 - 10)
- Customer balance = 1150.00 SAR
- ZATCA clearance scheduled (visible in queue)
- Within 30s: ZATCA status = CLEARED, QR code visible
- Audit log entries for: invoice create, JE post, stock movement

#### Postconditions
- Invoice remains POSTED until paid or credited
- Cannot edit after POSTED — only reverse or credit note

---

### TC-PC-001: إقفال الشهر

| ID | TC-PC-001 |
|---|---|
| **Title** | إقفال شهر مارس 2026 بنجاح |
| **Priority** | Critical |
| **Type** | Functional / Workflow |
| **Module** | Accounting |

#### Preconditions
- Period March 2026 is OPEN
- All sub-ledgers reconciled to GL
- All banks reconciled (last reconciliation = March 31)
- All journal entries POSTED (none in DRAFT)
- Fixed assets exist for depreciation
- Foreign currency balances exist
- Recurring journals configured

#### Steps
1. Login as CFO
2. Navigate to `/accounting/period-close`
3. Select Period = March 2026
4. Click "Start Close"
5. System runs 13-step checklist
6. Monitor progress
7. Verify trial balance = 0 ± 0.01
8. Click "Lock Period"

#### Expected Results
- Each step shows ✓ or ✗ with timestamp
- Trial balance balanced after all steps
- Comparative financial statements generated
- Period status = CLOSED
- Subsequent posting to March attempts → blocked
- Audit trail captures close event with user, time, parameters
- Email sent to finance team with FS attached

---

### TC-ZAT-001: ZATCA Clearance Success

| ID | TC-ZAT-001 |
|---|---|
| **Title** | ZATCA Phase 2 clearance ناجح |
| **Priority** | Critical |
| **Type** | Functional / Integration |
| **Module** | Tax / ZATCA |

#### Preconditions
- Tenant ZATCA onboarded (CSID + PCSID)
- Certificate not expired
- Customer "ABC Trading" with VAT number "311111111111111"

#### Steps
1. Create invoice via API:
   ```
   POST /api/sales/invoices
   {
     customerId: "ABC",
     invoiceDate: now,
     lines: [{ productId: "P-001", qty: 10, unitPrice: 100, vatRate: 0.15 }]
   }
   ```
2. Observe ZATCA queue
3. Wait for clearance response

#### Expected Results
- UBL 2.1 XML generated
- ICV = previous + 1 (gap-free)
- PIH = sha256 of previous canonical XML
- XML signed with X.509
- POST to ZATCA Clearance API succeeds (HTTP 200)
- Response contains cleared XML + signature
- Invoice status = CLEARED
- QR code (TLV format) generated and visible on PDF
- ZATCARecord saved with uuid, icv, hash, cleared_at

---

### TC-PAY-001: Monthly Payroll Run

| ID | TC-PAY-001 |
|---|---|
| **Title** | تشغيل الرواتب الشهري |
| **Priority** | High |
| **Type** | Functional / Integration |

#### Preconditions
- 45 employees active: 30 Saudi + 15 foreign
- All salary structures configured
- 3 employees have active loans
- 2 employees have unpaid leave in April
- Overtime hours recorded for 8 employees

#### Steps
1. Login as payroll clerk
2. Navigate to `/hr/payroll/process`
3. Select period = April 2026
4. Click "Calculate Preview"
5. Review computation per employee
6. Click "Run Payroll"

#### Expected Results
- For each Saudi employee:
  - Gross = basic + allowances + overtime - unpaid_leave_deduction
  - GOSI Employee = min(basic, 45000) × 9%
  - Employer GOSI = (basic × 9%) + (basic × 2% SANED)
  - Net = Gross - GOSI Employee - loans - garnishments
- For each foreign employee:
  - GOSI = 2% occupational only
  - WHT applied if applicable
- WPS file generated in SIF format
- Total amount matches sum of nets
- Journal entries POSTED:
  - DR Wage Expense (gross sum × 1 + employer GOSI sum)
  - CR Wages Payable (net sum)
  - CR GOSI Payable (employee + employer + SANED)
  - CR Loan Receivable (deductions sum)
- Payslips generated as PDFs and queued for email
- Mudad sync record created (for Saudi labor authority)

---

### TC-TENANT-001: Multi-Tenant Isolation

| ID | TC-TENANT-001 |
|---|---|
| **Title** | لا يمكن لمستأجر A الوصول لبيانات مستأجر B |
| **Priority** | Critical |
| **Type** | Security |

#### Preconditions
- Tenant A and Tenant B exist
- Tenant A has customer "CustA-1"
- Tenant B has customer "CustB-1"
- User "userA" belongs to Tenant A
- User "userB" belongs to Tenant B

#### Steps
1. Login as userA
2. Try GET /api/customers/CustB-1
3. Try POST /api/sales/invoices with customerId="CustB-1"
4. Try direct DB query (if elevated) for tenantB data using tenantA token

#### Expected Results
- All attempts return 404 (not 403 to prevent enumeration)
- Audit log records the attempts as suspicious
- No data leakage in error messages
- Even with raw SQL, tenant guard middleware injected forces tenant_id filter

---

## Test Coverage Matrix

| Module | Unit % | Integration % | E2E |
|---|---|---|---|
| auto-journal | 100% | 95% | covered |
| zatca | 100% | 90% | covered |
| period-close | 95% | 100% | covered |
| depreciation | 100% | 90% | covered |
| eos | 100% | 90% | covered |
| payroll | 95% | 95% | covered |
| three-way-match | 100% | 100% | covered |
| sales-invoice | 95% | 95% | covered |
| inventory-costing | 100% | 95% | covered |
| mrp | 85% | 80% | covered |
| approvals | 90% | 90% | covered |
| rest | 80% | 70% | sample |

## Defect Severity

| Severity | Definition | Response |
|---|---|---|
| **S1 — Critical** | Data corruption, GL imbalance, security breach, ZATCA reject | Stop everything, fix within 4h |
| **S2 — High** | Major feature broken, can't process invoices | Same-day fix |
| **S3 — Medium** | Workaround exists, single user affected | Within sprint |
| **S4 — Low** | Cosmetic, edge case | Next sprint |

## Test Data Sets

- **Demo Saudi Restaurant Chain** — 4 branches, 200 products, 50 staff
- **Demo Manufacturing SME** — 30 BOMs, 60 employees, 90 days history
- **Demo Trading Company** — 1000 customers, 500 vendors, multi-currency
- **Demo Clinic** — 5 doctors, 1000 patients, NPHIES integration
- **Demo School** — 500 students, 30 teachers, 5 grade levels

كل dataset في `scripts/seed-{type}-demo.ts` ويُعاد تشغيله قبل full regression.

## Test Execution Schedule

| الفترة | الاختبارات |
|---|---|
| كل commit | lint + typecheck + unit |
| كل PR | + integration + selected E2E |
| nightly | full regression + accounting invariants |
| weekly | + performance + load |
| monthly | + security scan + dependency audit |
| pre-release | + smoke on staging + manual UAT |
