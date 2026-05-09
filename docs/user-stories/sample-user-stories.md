# User Stories & Acceptance Criteria — Namasoft ERP

> **آخر تحديث:** 2026-05-10
> **Format:** Connextra ("As a ___, I want ___, so that ___") + Gherkin acceptance criteria.

---

## 1. صياغة قياسية

```
ID:     US-MMM-NNN              (MMM = module, NNN = sequence)
Title:  Concise verb phrase
Role:   Persona (e.g., Cashier, Accounting Admin)
Story:  As a {role}, I want {capability}, so that {benefit}.
Priority: P0 / P1 / P2
Estimate: S / M / L / XL
Dependencies: [other story IDs]

Acceptance Criteria (Gherkin):
  Scenario: ...
    Given ...
    When ...
    Then ...
```

---

## 2. عينات مفتاحية لكل موديول

### 2.1 Sales — US-SLS

#### US-SLS-001 — إنشاء فاتورة مبيعات

```
As a sales clerk
I want to create a sales invoice with multiple line items
So that I can bill the customer accurately for all goods sold.

Priority: P0   Estimate: M

AC:
  Scenario: Create draft invoice
    Given I am logged in as a sales clerk
    And customer "ACME" exists with credit limit 50,000 SAR
    When I create a new invoice with 3 lines totaling 10,000 SAR
    Then the invoice is saved with status "DRAFT"
    And the invoice number follows the tenant's numbering pattern
    And no journal entry is created yet

  Scenario: Credit limit warning
    Given customer ACME has 48,000 SAR outstanding
    When I create an invoice for 5,000 SAR (would exceed limit)
    Then I see a warning "Credit limit exceeded"
    And I can choose to override (with reason) or cancel

  Scenario: Tax calculation
    Given an invoice with line: qty=2, price=500, taxCode=VAT_15
    Then line subtotal = 1000
    And line tax = 150
    And line total = 1150
```

#### US-SLS-002 — ترحيل فاتورة وتوليد قيد محاسبي

```
As an accounting admin
I want posting an invoice to auto-generate the journal entry
So that GL stays in sync without manual data entry.

AC:
  Scenario: Post draft invoice
    Given a draft invoice with subtotal=1000, VAT=150, total=1150
    When I post the invoice
    Then status changes to "POSTED"
    And a JE is created: Dr Receivables 1150 / Cr Sales 1000 / Cr VAT Output 150
    And the JE balances (Σ Dr === Σ Cr, tolerance 0.01)
    And the JE is linked to the invoice

  Scenario: Cannot post in closed period
    Given period 2026-01 is closed
    And invoice issuedAt is 2026-01-15
    When I attempt to post
    Then I get error "PERIOD_CLOSED"
```

#### US-SLS-003 — إرسال الفاتورة لـ ZATCA

```
As an accounting admin
I want posted invoices to be auto-submitted to ZATCA Phase 2
So that we comply with Saudi e-invoicing without manual steps.

AC:
  Scenario: Successful clearance
    Given a posted B2B invoice with valid customer VAT number
    When the ZATCA submission worker processes it
    Then it generates UBL 2.1 XML
    And signs with the tenant's certificate
    And submits to ZATCA endpoint
    And on 200 response, stores UUID + cleared timestamp + QR code
    And invoice status is "ZATCA_CLEARED"

  Scenario: ZATCA rejection
    Given ZATCA returns 400 with errors
    Then invoice is flagged "ZATCA_REJECTED"
    And errors are visible to the admin
    And the retry button is available
```

---

### 2.2 POS — US-POS

#### US-POS-001 — فتح وردية كاشير

```
As a cashier
I want to open a session with a starting cash float
So that variance is calculated correctly at end of shift.

AC:
  Scenario: Open session
    Given no open session for cashier in this terminal
    When I enter starting float = 500 SAR
    Then a new session is created (status=OPEN)
    And starting cash = 500 SAR is recorded
    And I can begin sales

  Scenario: Cannot open second session
    Given I already have an OPEN session
    When I try to open another
    Then I get "Already open: session #1234, please close it first"
```

#### US-POS-002 — إغلاق الوردية وحساب الفروقات

```
AC:
  Scenario: End-of-shift cash count
    Given session opened with float=500 and cash sales=2350
    When I close session and declare cash on hand = 2840
    Then variance = 2840 - (500 + 2350) = -10 SAR (short)
    And session status = "CLOSED"
    And a JE posts the cash difference to "Cash Over/Short"
```

---

### 2.3 Inventory — US-INV

#### US-INV-001 — إصدار حركة مخزون من بيع

```
AC:
  Scenario: Auto stock-out on invoice post
    Given item "Rice 5kg" qty 50 in warehouse "Main"
    And an invoice for 3 units posted
    Then stock movement = -3 in "Main" warehouse
    And remaining qty = 47
    And COGS journal: Dr COGS / Cr Inventory at average cost
```

#### US-INV-002 — تكلفة المتوسط المتحرك (Weighted Average)

```
AC:
  Scenario: Compute weighted avg cost
    Given existing stock: qty=10 @ 100 SAR (avg=100)
    When 5 units received at 110 SAR
    Then new avg = ((10*100) + (5*110)) / 15 = 103.33 SAR
    And next outflow uses 103.33 as cost
```

---

### 2.4 Manufacturing — US-MFG

#### US-MFG-001 — إنشاء أمر تصنيع من BOM

```
As a production planner
I want to issue a Manufacturing Order from a BOM
So that materials are reserved and routing is scheduled.

AC:
  Scenario: Issue MO
    Given BOM for "Cake 1kg" requires: flour 0.5kg, sugar 0.3kg, eggs 5
    When I create MO for qty=10
    Then material requirement = flour 5kg, sugar 3kg, eggs 50
    And availability check runs against current stock
    And shortage list (if any) is shown
    And MO status = "PLANNED"
```

---

### 2.5 Payroll — US-PAY

#### US-PAY-001 — تشغيل دورة رواتب شهرية

```
As an HR admin
I want to run monthly payroll
So that all employees are paid accurately and GOSI/SANED are deducted.

AC:
  Scenario: Run May 2026 payroll
    Given 25 active employees with valid contracts
    When I run pay for period 2026-05
    Then each employee gets a payslip with:
      - Gross salary (per contract)
      - GOSI 9% deduction (employee)
      - SANED 1% deduction (Saudi only)
      - Net salary
    And employer GOSI 9% + SANED 1% accrued
    And one JE posts:
      Dr Salaries Expense (gross)
      Dr Employer GOSI Expense
      Cr Salaries Payable
      Cr GOSI Payable
      Cr SANED Payable
    And WPS SIF file is ready to download

  Scenario: Cannot run payroll twice
    Given pay run for 2026-05 status=POSTED
    When I attempt to re-run
    Then I get "Period 2026-05 already run; create adjustment instead"
```

---

### 2.6 Accounting — US-ACC

#### US-ACC-001 — قيد يدوي

```
AC:
  Scenario: Save unbalanced JE
    Given a JE draft with Dr 1000 / Cr 900
    When I attempt to save
    Then I get "JOURNAL_NOT_BALANCED: difference 100 SAR"
    And the entry is NOT saved

  Scenario: Post balanced JE
    Given a JE with Dr 1000 / Cr 1000
    When I post
    Then status = POSTED
    And the entry shows in trial balance immediately

  Scenario: Reverse a posted JE
    Given a posted JE
    When I click Reverse
    Then a new JE is created mirroring the original (swapped Dr/Cr)
    And both are linked
    And the original JE remains unchanged
```

#### US-ACC-002 — إقفال فترة محاسبية

```
AC:
  Scenario: Close period with all checklist items passed
    Given period 2026-04 has:
      - 0 draft invoices in this period
      - All bank recs done
      - FX revaluation run
      - All AR/AP aged correctly
    When I click "Close period"
    Then status = CLOSED
    And no further JEs can post to 2026-04
    And the next period 2026-05 opens automatically
```

---

### 2.7 ZATCA — US-ZAT

#### US-ZAT-001 — متسلسل ICV بدون فجوات

```
AC:
  Scenario: Sequential ICV
    Given last invoice ICV = 999
    When I post a new invoice
    Then new invoice's ICV = 1000
    And no gaps in ICV history (verified by audit query)
```

---

### 2.8 Reports — US-RPT

#### US-RPT-001 — قائمة الدخل (P&L)

```
AC:
  Scenario: Generate P&L for period
    Given posted JEs in 2026-Q1
    When I run P&L for 2026-Q1
    Then I see:
      Revenue: sum of 4xxx
      Less: Sales returns (4200 contra)
      Net Revenue
      Cost of Goods Sold (5100)
      Gross Profit
      Operating Expenses (5xxx other)
      Operating Income
      ...
    And I can export to PDF (bilingual) or Excel
```

---

## 3. Backlog Index

| Module | Stories | P0 | P1 | P2 |
|--------|---------|----|----|-----|
| Sales | US-SLS-001..050 | 18 | 22 | 10 |
| POS | US-POS-001..030 | 12 | 12 | 6 |
| Purchases | US-PUR-001..045 | 15 | 20 | 10 |
| Inventory | US-INV-001..035 | 10 | 18 | 7 |
| Manufacturing | US-MFG-001..030 | 8 | 14 | 8 |
| HR | US-HR-001..040 | 12 | 18 | 10 |
| Payroll | US-PAY-001..025 | 10 | 12 | 3 |
| Accounting | US-ACC-001..050 | 18 | 22 | 10 |
| Treasury | US-TRE-001..025 | 8 | 12 | 5 |
| ZATCA | US-ZAT-001..015 | 8 | 5 | 2 |
| Reports | US-RPT-001..030 | 10 | 15 | 5 |
| Settings | US-SET-001..025 | 10 | 10 | 5 |

> Full backlog lives in: `docs/user-stories/backlog/<module>.md` (TODO: split out of this index doc).

---

## 4. References

- [Test Plan](../testing/test-plan.md) — acceptance criteria → test cases
- [Style Guide](../ux/style-guide.md) — UI specs
- [BUSINESS_FLOWS_GUIDE.md](../../BUSINESS_FLOWS_GUIDE.md) — flow context
