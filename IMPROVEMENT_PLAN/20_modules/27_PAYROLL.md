# 27 — Payroll | الرواتب

## 🟠 الأولوية: عالي | الاكتمال: 50%

## 🔍 الموجود
- Salary, PayrollRun
- GOSI calculator
- WPS generator
- EOS calculator (Saudi)
- محركات اختبارية موجودة في tests/

## 🔴 الفجوات
- لا Loans Management كامل
- لا Advances workflow
- Bonuses / Incentives بسيط
- لا Variable pay (commissions)
- لا Multi-component salary structure
- WPS متعدد البنوك ضعيف
- لا Payroll Reconciliation
- لا Payslip portal/email
- لا Tax certificates للأجانب
- لا Year-end processing
- Bank file formats محدودة (SAR Riyal فقط)

## 🎯 الخطة

### 27.1 — Loans Management (5 أيام)
- Loan request → approval → disbursement
- Auto-deduction from salary
- Interest calculation (لو وجد)
- Outstanding balance tracking
- Early settlement

### 27.2 — Advances (3 أيام)
- Salary advance requests
- Approval workflow
- Auto-recovery from next salary

### 27.3 — Variable Pay (6 أيام)
- Commission rules per role
- Performance-based bonuses
- KPI-tied incentives
- Multi-period calculations

### 27.4 — Multi-Component Salary (4 أيام)
- Basic, Housing, Transport, Other
- Allowances per role/grade
- Custom allowances
- Tax treatment per component

### 27.5 — Payslip Portal + Email (4 أيام)
- Encrypted PDF
- Self-service access
- Email + WhatsApp delivery
- Multi-language

### 27.6 — Year-End Processing (5 أيام)
- Annual GOSI reconciliation
- Year-end EOS provision
- Tax certificates (لغير السعوديين)
- Annual statements

### 27.7 — Multi-Bank WPS (5 أيام)
- AlRajhi، SNB، Riyad، البلاد formats
- Bulk upload
- Confirmation tracking
- Rejected payments handling

### 27.8 — Payroll Reconciliation (4 أيام)
- Pre-run validation (attendance، contracts)
- Variance analysis vs previous month
- Audit trail
- Approval before commit

### 27.9 — Reports (5 أيام)
- Payroll register
- GOSI register
- Bank summary
- Department-wise breakdown
- Year-over-year comparison

## 📊 KPIs
| KPI | قبل | بعد |
|-----|-----|-----|
| Payroll run time (1000 emp) | غير محدد | < 5 min |
| WPS submission errors | غير متابع | < 1% |
| Loan tracking accuracy | يدوي | تلقائي |
| Employee payslip access | لا | self-service |

## ⏱️ المدة: 41 يوم عمل
