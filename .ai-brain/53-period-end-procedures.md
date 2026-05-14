# 53 - إجراءات نهاية الفترة (Period-End Procedures)

> Daily + Weekly + Monthly + Quarterly + Year-End — تفصيل كل خطوة

---

## 📅 الإجراءات اليومية (Daily)

### نهاية كل يوم عمل:

```
☐ 1. إقفال جلسات POS:
     - كل كاشير يُغلق جلسته
     - Cash counting
     - Variance reporting
     
☐ 2. تأكيد إصدار كل الفواتير:
     - لا فواتير في DRAFT
     - كل فاتورة ZATCA processed
     
☐ 3. مراجعة الـ AuditLog:
     - أي إجراءات حساسة؟
     - فواتير محذوفة؟
     - تعديلات على settings؟
     
☐ 4. Bank deposits:
     - إيداع النقد في الـ Bank Drop
     - إيداع الـ Cheques
     
☐ 5. Inventory check:
     - أي منتجات قاربت من الانتهاء؟
     - أي منتجات تحت minimum?
     
☐ 6. Backup verification:
     - cron-backup شُغّل بنجاح؟
     - الـ backup file موجود؟
     
☐ 7. Health Check:
     - GET /api/sys/health
     - كل services up
     
☐ 8. AI Auditor:
     - cron-daily-audit (3 AM next day)
     - مراجعة التقرير صباحاً
```

### أمثلة JEs اليومية:
- POS Closing: Dr Cash / Cr POS Sessions
- Bank Deposits: Dr Bank / Cr Cash
- Daily Returns: Reversal entries
- Daily Adjustments (إذا needed)

---

## 📆 الإجراءات الأسبوعية (Weekly)

### كل يوم أحد (بداية الأسبوع):

```
☐ 1. AR Aging Review:
     - GET /api/reports/aging?type=AR
     - تصنيف العملاء:
       - Current
       - 1-30 days
       - 31-60 days
       - 61-90 days
       - > 90 days
     - الإجراءات:
       - 30 days: Dunning Level 1 (تذكير ودي)
       - 60 days: Level 2 (تحذير)
       - 90 days: Level 3 (إنذار قانوني)
       - 120+: Credit Hold + Najiz consideration

☐ 2. AP Aging Review:
     - GET /api/reports/aging?type=AP
     - تحديد الـ Payment Run المطلوب
     - تأكيد الـ cash availability
     
☐ 3. Cash Forecast:
     - GET /api/treasury/cash-forecast?days=30
     - أي shortfall متوقع؟
     - الإجراءات لتخفيف الـ risk
     
☐ 4. Vendor Performance:
     - أي مورد late؟
     - تأخر deliveries
     - أي quality issues
     
☐ 5. Sales Pipeline:
     - opportunities pending
     - quotes expired
     - leads cold
     
☐ 6. Inventory Cycle Count:
     - 5-10 SKUs (high-value items)
     - tracking variance
     
☐ 7. Approval Inbox Cleanup:
     - أي pending > 3 days?
     - escalation
```

### المخرجات الأسبوعية:
- Weekly Sales Report
- Weekly Cash Position
- AR/AP Aging Reports
- Sales Pipeline Report

---

## 📅 الإجراءات الشهرية (Monthly) — 16 خطوة

### نهاية الشهر (آخر يوم عمل + 5 أيام):

#### Day 1 (آخر يوم في الشهر) — Pre-Close:
```
☐ 1. Stop all transactions (cutoff):
     - لا فواتير جديدة بعد 11 PM
     - أي معاملات بعدها → الشهر القادم
     
☐ 2. Complete pending tasks:
     - كل GRN له فاتورة
     - كل فاتورة POSTED
     - لا DRAFT JEs
     
☐ 3. Trigger end-of-month crons (cron schedule):
     - 23:00 — Depreciation
     - 22:00 — FX Revaluation
     - 23:30 — IFRS 16
     - 00:00 — Period close engine
```

#### Day 2-5 (الأول-الخامس من الشهر التالي):

```
☐ 4. Accruals:
     - مصروفات شهر مايو تصل في يونيو (utilities, etc.)
     - JE: Dr Utilities Exp / Cr Accrued Liabilities
     
☐ 5. Prepayments amortization:
     - تأمين سنوي → 1/12 شهرياً
     - الإيجار المقدم
     - JE: Dr Insurance Exp / Cr Prepaid Insurance
     
☐ 6. Inventory adjustments:
     - تسوية الـ cycle count variances
     - JE: Dr/Cr Inventory Adjustment / Inventory
     
☐ 7. Depreciation reconciliation:
     - تأكد كل الأصول مُهلكة
     - JE تلقائي تم
     
☐ 8. FX Revaluation:
     - حسابات أجنبية
     - JE: FX Gain/Loss
     
☐ 9. ECL (Expected Credit Loss):
     - مخصص الديون المشكوك فيها
     - JE: Dr Bad Debt Exp / Cr Allowance
     
☐ 10. IFRS 16 (Leases):
     - تسوية ROU + Lease Liability
     - JE: Dr Interest / Dr Amortization / Cr Lease Liability
     
☐ 11. WHT Form 14:
     - تقرير شهري
     - الـ submission
     - الدفع
     - JE: Dr WHT Payable / Cr Bank
     
☐ 12. GOSI Monthly File:
     - generate
     - upload to GOSI portal
     - الدفع
     - JE: Dr GOSI Payable / Cr Bank
     
☐ 13. Bank Reconciliation Final:
     - كل البنوك مُسوّاة
     - الـ outstanding items موثقة
     
☐ 14. Trial Balance:
     - generate
     - يجب يتوازن
     - إذا variance → investigate
     
☐ 15. Financial Statements:
     - P&L
     - Balance Sheet
     - Cash Flow
     - Statement of Changes in Equity
     
☐ 16. Lock the Period:
     - POST /api/accounting/period-close/{id}/lock
     - FiscalPeriod.locked = true
     - notify stakeholders
```

### MRP/المخزون شهرياً:
- ☐ MRP run
- ☐ Reorder point review
- ☐ Slow-moving inventory review
- ☐ Dead stock identification

### HR شهرياً:
- ☐ Payroll calculation (cron 28)
- ☐ Payroll approval
- ☐ Payroll posting (cron 28)
- ☐ WPS SIF generation
- ☐ Bank upload
- ☐ Salaries paid

### المخرجات الشهرية:
- Trial Balance
- Income Statement
- Balance Sheet
- Cash Flow Statement
- AR Aging
- AP Aging
- Inventory Valuation
- Budget vs Actual
- Department P&L
- Cost Center Report

---

## 📅 الإجراءات الربعية (Quarterly)

### Q1 (Mar 31), Q2 (Jun 30), Q3 (Sep 30), Q4 (Dec 31):

```
☐ 1. VAT Return (إذا quarterly filer):
     - إجمالي output VAT
     - إجمالي input VAT
     - net VAT payable
     - التقديم لـ ZATCA portal
     - الدفع خلال 30 يوم
     - JE: Dr VAT Payable / Cr Bank
     
☐ 2. Board Meeting Prep:
     - Quarterly financial review
     - KPI dashboard
     - Strategic updates
     
☐ 3. Budget Review:
     - YTD vs Budget
     - Variances investigation
     - Forecast adjustments
     
☐ 4. Vendor Scorecards:
     - quarterly performance
     - contract renewals decisions
     
☐ 5. Employee Performance Check-ins:
     - mid-year prep
     - 1-on-1 meetings
     
☐ 6. Risk Assessment:
     - operational risks
     - financial risks
     - compliance risks
     
☐ 7. Customer Health Review:
     - top customers status
     - churn risks
     - upsell opportunities
```

---

## 📅 الإجراءات السنوية (Year-End)

### من نوفمبر إلى مارس (للسنة المالية ديسمبر):

#### نوفمبر-ديسمبر — التحضير:
```
☐ 1. Year-End Planning Memo:
     - Timeline
     - Responsibilities
     - Key dates
     
☐ 2. Inventory Full Count:
     - Full physical inventory
     - Date: 31 Dec (close of business)
     - All staff involved
     
☐ 3. Asset Verification:
     - Physical check of all fixed assets
     - Identify obsolete/damaged
     - Plan for disposal
     
☐ 4. AR Review:
     - Bad debt write-offs
     - Final dunning for old debts
     - Letters of demand
     
☐ 5. AP Review:
     - Settle outstanding payables
     - Accrue what's necessary
```

#### يناير — الإقفال السنوي:
```
☐ 6. Final Trial Balance:
     - Dec 31
     - Reconciliation of all accounts
     
☐ 7. Year-End Adjustments:
     - Bad debt write-offs:
       JE: Dr Allowance / Cr AR
     - Inventory write-downs:
       JE: Dr Inventory Loss / Cr Inventory
     - Asset impairments:
       JE: Dr Impairment Loss / Cr Asset
     - Final depreciation
     - Final accruals
     
☐ 8. Closing Entries:
     - Close revenue accounts to Retained Earnings:
       JE: Dr Revenue / Cr Income Summary
       JE: Dr Income Summary / Cr Retained Earnings
     - Close expense accounts:
       JE: Dr Income Summary / Cr Expenses
     - Net effect → Retained Earnings updated
     
☐ 9. Lock Fiscal Year:
     - All periods (1-12) locked
     - FiscalYear.locked = true
     - Backup before lock
```

#### فبراير-أبريل — الـ Compliance:
```
☐ 10. Zakat Assessment:
     - Calculate zakatable base
     - Saudi ownership %
     - Zakat = base × 2.5%
     - JE: Dr Zakat Expense / Cr Zakat Payable
     - Submit to ZATCA portal (within 120 days)
     - Payment
     - JE: Dr Zakat Payable / Cr Bank
     
☐ 11. Annual Tax Return:
     - For companies with foreign shareholders
     - Income tax 20% (on foreign share)
     - Submit + pay
     
☐ 12. External Audit (if applicable):
     - Independent auditor
     - Audited financial statements
     - Audit report
     
☐ 13. CR Renewal (if year-end):
     - Renew Commercial Registration
     - SOCPA renewal (if applicable)
     - Other licenses
     
☐ 14. Financial Statements (Annual):
     - Statement of Comprehensive Income
     - Statement of Financial Position
     - Statement of Cash Flows
     - Statement of Changes in Equity
     - Notes to Financial Statements
     
☐ 15. Annual Report:
     - Management discussion & analysis
     - For shareholders / stakeholders
     
☐ 16. Tax Reconciliation:
     - VAT annual review
     - WHT total
     - GOSI total
     - All tax records archived
```

#### مارس-أبريل — التخطيط للسنة القادمة:
```
☐ 17. Annual Budget:
     - For new fiscal year
     - Department budgets
     - Capital expenditure plan
     - Hiring plan
     
☐ 18. Strategic Planning:
     - 3-5 year plan review
     - SWOT analysis
     - Initiatives prioritization
     
☐ 19. Performance Reviews:
     - All employees
     - 360-degree feedback
     - Salary increases
     - Promotions
     - Bonus allocation
     
☐ 20. Open New Fiscal Year:
     - POST /api/accounting/fiscal-year
     - Generate periods 1-12
     - Set as current
     - Carry forward balances
```

### Year-End Closing Entry Example:
```
الخطوة 1: إقفال الإيرادات
Dr Sales Revenue (4110)           1,000,000
Dr Other Income (4920)               50,000
   Cr Income Summary (3300)             1,050,000

الخطوة 2: إقفال المصروفات
Dr Income Summary (3300)            800,000
   Cr COGS (5110)                       500,000
   Cr Salary Exp (5210)                 200,000
   Cr Other Expenses                    100,000

الخطوة 3: تحويل الصافي للأرباح المرحلة
Dr Income Summary (3300)            250,000
   Cr Retained Earnings (3210)          250,000

(Net Income = 1,050,000 - 800,000 = 250,000)
```

---

## 📋 Year-End Checklist Detailed

### Financial:
- [ ] Trial Balance reviewed
- [ ] Bank Recs all closed
- [ ] AR Aging analyzed
- [ ] AP Aging analyzed
- [ ] Inventory count completed
- [ ] Asset verification done
- [ ] Accruals booked
- [ ] Prepayments amortized
- [ ] Depreciation final
- [ ] FX revaluation final
- [ ] Bad debts written off
- [ ] Provisions reviewed
- [ ] Inter-company reconciled
- [ ] Closing entries posted
- [ ] FS prepared
- [ ] FS reviewed by CPA
- [ ] FS approved by Board

### Tax & Compliance:
- [ ] VAT return Q4
- [ ] WHT Form 14 Dec
- [ ] GOSI Dec submitted
- [ ] Zakat assessment prepared
- [ ] Annual tax return prepared
- [ ] All tax obligations met

### HR:
- [ ] Year-end bonuses paid
- [ ] Performance reviews done
- [ ] Salary increases approved
- [ ] EOS for departing employees
- [ ] Saudization status verified
- [ ] Workforce planning for next year

### Operational:
- [ ] All POs cleared
- [ ] All GRNs matched
- [ ] All POS sessions closed
- [ ] All projects status updated
- [ ] Inventory aging reviewed

### Strategic:
- [ ] Annual budget approved
- [ ] Capital plans set
- [ ] Hiring plan set
- [ ] Strategic initiatives defined

### System:
- [ ] Full backup taken
- [ ] Archive old data (5+ years)
- [ ] Performance optimization
- [ ] Security audit
- [ ] User access review

---

## 🎯 ملاحظات حرجة

### القواعد الذهبية:
1. ❌ **لا تفتح فترة مقفلة** بدون موافقة Owner + Audit log
2. ✅ **نسخة احتياطية** قبل أي إقفال
3. ✅ **Review مع CPA** قبل الـ Lock النهائي
4. ✅ **Stakeholder communication** قبل وبعد
5. ✅ **Documentation كامل** لكل قرار
6. ✅ **Audit trail** لكل تعديل

### الإجراءات في حالة الطوارئ:
- إذا الـ Trial Balance لا يتوازن:
  1. لا تـ force balance
  2. فحص كل JE في الفترة
  3. ابحث عن: missing entries, transposition errors
  4. أصلح ثم أعد التشغيل

- إذا فات موعد الـ Tax submission:
  1. تواصل فوراً مع ZATCA
  2. accept penalty
  3. submit ASAP
  4. منع التكرار

- إذا الـ Period closed و اكتشفنا خطأ كبير:
  1. تواصل مع CFO + CPA
  2. evaluate impact
  3. إذا material → reopen + correct + re-close
  4. إذا immaterial → adjust في الفترة الحالية
  5. وثّق

---

## 🌐 Multi-Tenant Considerations

### لكل tenant:
- Period close مستقل
- Fiscal year قد يختلف
- Tax submissions منفصلة
- لكن: deploy.js يمكن تشغيل crons لكل الـ tenants

### Bulk Period Close:
```bash
# Master Owner يمكنه:
POST /api/master-panel/bulk-period-close
{ tenants: ['aljassim', 'alqashan', ...], period: '2026-05' }
```

---

## 🎯 الـ KPIs بعد كل فترة

| الـ KPI | Target | الفترة |
|---|---|---|
| Days to Close | < 5 days | Monthly |
| Days to Close | < 30 days | Year-end |
| Trial Balance Variance | 0 | Always |
| Bank Recon Coverage | 100% | Monthly |
| Accruals Accuracy | > 95% | Monthly |
| Budget Variance | < 10% | Quarterly |
| Tax Submissions On-Time | 100% | Always |
| Audit Findings | < 5 items | Annual |

---

## 🚀 الـ Continuous Improvement

كل سنة:
- مراجعة الـ procedures
- تحديد الـ bottlenecks
- أتمتة المزيد
- تدريب الفريق
- تحديث الـ documentation
