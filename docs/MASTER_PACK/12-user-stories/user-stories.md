---
version: 1.0
last_updated: 2026-05-12
---

# User Stories & Acceptance Criteria

> صيغة Gherkin (Given-When-Then) — جاهزة لتحويلها إلى E2E tests.

## US-001 — Sales Rep: Create Invoice

**As a** sales representative
**I want to** create a sales invoice for an existing customer
**So that** I can bill them for delivered goods/services and post to AR.

### Acceptance Criteria

```gherkin
Feature: Create Sales Invoice
  
  Background:
    Given I am logged in as "sales-rep@test.sa"
    And tenant "ACME Co" has customer "ABC Trading"
    And tenant "ACME Co" has product "P-001" at price 100 SAR

  Scenario: Successful invoice creation within credit limit
    Given customer "ABC Trading" has credit limit 50000 SAR
    And customer "ABC Trading" current balance is 0 SAR
    When I create an invoice with:
      | customer    | ABC Trading      |
      | line 1      | P-001 × 10 @ 100 |
      | payment terms | Net 30          |
    Then the invoice status should be "POSTED"
    And the grand total should be 1150.00 SAR
    And a journal entry should be created with:
      | account            | debit  | credit |
      | Accounts Receivable| 1150.00 |        |
      | Revenue            |         | 1000.00 |
      | VAT Output         |         | 150.00  |
      | COGS               | 300.00  |         |
      | Inventory          |         | 300.00  |
    And the stock of "P-001" should decrease by 10
    And ZATCA clearance should be submitted within 30 seconds
  
  Scenario: Blocked by credit limit
    Given customer "ABC Trading" has credit limit 1000 SAR
    And customer "ABC Trading" current balance is 800 SAR
    When I try to create an invoice with total 500 SAR
    Then I should see error "تجاوز حد الائتمان"
    And no invoice should be created
    And no journal should be posted
  
  Scenario: ZATCA clearance failure handling
    Given ZATCA API is returning HTTP 500
    When I create an invoice
    Then the invoice should still be POSTED
    And a ZATCA retry should be scheduled
    And a system alert should notify the admin
```

---

## US-002 — Sales Manager: Approve High-Value Order

```gherkin
Feature: High-Value Order Approval
  
  Scenario: Order > 50000 SAR requires manager approval
    Given I am logged in as "sales-rep@test.sa"
    When I create a sales order totaling 75000 SAR
    Then the order status should be "PENDING_APPROVAL"
    And an approval request should be sent to "sales-manager@test.sa"
    And the customer should not yet see the order confirmation
  
  Scenario: Manager approves
    Given there is an order pending my approval
    When I am logged in as "sales-manager@test.sa"
    And I navigate to /approvals
    And I click "Approve" on the order
    Then the order status should change to "APPROVED"
    And the customer should receive an email
    And the warehouse should receive a pick request
```

---

## US-003 — CFO: Close Month

```gherkin
Feature: Period Close
  
  Background:
    Given I am logged in as "cfo@test.sa"
    And the current period is March 2026
  
  Scenario: All checklists pass — close succeeds
    Given all sub-ledger reconciliations are complete
    And all banks are reconciled
    And there are no unposted journal entries
    When I initiate close for March 2026
    Then the system should run:
      | step                       |
      | Post recurring journals    |
      | Post accruals             |
      | Post deferrals            |
      | Post monthly depreciation  |
      | FX revaluation            |
      | Cost allocations          |
      | Inventory adjustments     |
      | Variance calculation      |
      | WIP clearing              |
      | Generate trial balance    |
      | Comparative FS            |
      | Lock period               |
    And trial balance should be zero (within 0.01)
    And the period status should be "CLOSED"
    And no further posting should be allowed without reopen
  
  Scenario: Bank not reconciled — close blocked
    Given bank "AlRajhi-Main" is not reconciled for March
    When I initiate close for March 2026
    Then I should see error "البنوك التالية لم تتم تسويتها: AlRajhi-Main"
    And the close should not proceed
```

---

## US-004 — AP Clerk: Three-Way Match

```gherkin
Feature: Three-Way Match
  
  Scenario: Auto-match within tolerance
    Given there is a PO #PO-1234 for 100 units @ 50 SAR
    And a GRN #GRN-5678 received 100 units
    When an invoice is uploaded with 100 units @ 50.20 SAR
    And the price tolerance is 1%
    Then the invoice should auto-match
    And status should be "MATCHED"
    And AP should be posted: AP 5775 CR / Inventory 5000 DR + Variance 20 DR + VAT 750 DR
  
  Scenario: Quantity mismatch beyond tolerance — held
    Given PO is for 100 units and GRN is for 100 units
    When invoice is for 105 units
    And quantity tolerance is 2%
    Then the match should fail
    And invoice status should be "HELD"
    And an exception case should open for AP manager
```

---

## US-005 — Warehouse Picker: Pick Order

```gherkin
Feature: Wave-Picking
  
  Background:
    Given I am logged in as picker "picker-01@test.sa"
    And I have a handheld scanner
  
  Scenario: Pick a wave assigned to me
    Given a wave "W-001" with 5 orders is assigned to me
    When I scan my badge
    Then the app should show the wave's first pick task
    And I should see: bin location + product + quantity
    When I scan the bin barcode
    Then the app should confirm location
    When I scan the product barcode
    Then the app should ask for quantity confirmation
    When I enter 10
    And the expected was 10
    Then the pick should be confirmed
    And the system should move to next task
  
  Scenario: Scanned wrong product
    When I scan a product different from expected
    Then the app should show "منتج خاطئ — توقع P-001"
    And the pick should NOT be confirmed
    And an audit log should be created
  
  Scenario: Short pick
    Given expected quantity is 10
    When I report 7 picked (3 short)
    Then a stock discrepancy should be recorded
    And the order line should be marked "SHORT_PICKED"
    And purchase suggestion should consider this
```

---

## US-006 — Payroll Clerk: Run Monthly Payroll

```gherkin
Feature: Monthly Payroll
  
  Scenario: Run payroll for April 2026
    Given I am logged in as "payroll@test.sa"
    And April 2026 has 30 days
    And 45 employees are active
    When I run payroll for April 2026
    Then for each Saudi employee:
      | item                  | computed                                |
      | Gross                 | basic + allowances + overtime           |
      | GOSI Employee 9%      | min(basic, 45000) × 0.09                |
      | Employer GOSI 9% + 2% | (basic × 0.09) + (basic × 0.02)         |
      | Loan deductions       | from active loans                       |
      | Net                   | gross - GOSI - loans - other deductions |
    And for each foreign employee:
      | GOSI 2% Occupational only |
      | WHT if applicable          |
    And total payroll should equal sum of nets
    And total cost should equal sum of (gross + employer GOSI)
    And WPS file should be generated in SIF format
    And journal entries should be POSTED:
      | DR: Wage Expense                   |
      | CR: Wages Payable                  |
      | CR: GOSI Payable                   |
      | CR: WHT Payable                    |
      | CR: Loan Receivable (deductions)   |
```

---

## US-007 — Customer (Portal): Pay Invoice

```gherkin
Feature: Customer Portal Payment
  
  Scenario: Pay invoice via saved card
    Given I am customer "ABC Trading" logged into portal
    And I have invoice INV-001 outstanding 1150 SAR
    And I have a saved card ending 4242
    When I navigate to /portal/cx/invoices
    And I click "Pay Now" on INV-001
    And I select my saved card
    And I confirm 1150 SAR
    Then the payment should process via Mada gateway
    And on success:
      | the invoice status should change to "PAID"   |
      | a payment confirmation email should be sent  |
      | my balance should decrease by 1150           |
      | a journal entry should post Bank/AR          |
      | the merchant fee should post to Bank Charges |
    And on failure:
      | I should see clear error                       |
      | I should be offered to use a different card    |
      | nothing should be charged                      |
```

---

## US-008 — Vendor (Portal): Submit Invoice

```gherkin
Feature: Vendor Invoice Submission
  
  Scenario: Submit invoice matching PO
    Given I am vendor "MEGA Suppliers" logged into vendor portal
    And there is PO #PO-2026 acknowledged by me
    And GRN was received for 100% of the PO
    When I navigate to /vendor-portal/invoices
    And I upload invoice PDF
    Then OCR should extract:
      | invoice number  |
      | invoice date    |
      | line items      |
      | totals          |
      | VAT             |
    And I confirm the extracted data
    When I submit
    Then three-way match should run automatically
    And if within tolerance: AP should be created with status PENDING_PAYMENT
    And I should see the invoice in my dashboard
    And payment expected date should be visible per payment terms
```

---

## US-009 — Manufacturing Supervisor: Complete MO

```gherkin
Feature: Complete Manufacturing Order
  
  Scenario: Successful completion with standard costing
    Given manufacturing order MO-100 is in WIP
    And BOM consumed materials worth 5000 SAR
    And labor hours logged: 40 hrs @ 50 SAR
    And overhead absorbed: 20%
    When I report 100 finished units
    Then standard cost = (materials + labor + overhead) / 100 units
    And finished goods should increase by 100 × standard cost
    And WIP should be cleared
    And variance journal should post if actual ≠ standard
    And the MO status should be "COMPLETED"
  
  Scenario: Partial completion
    When I report 70 finished + 5 scrap + 25 remaining in WIP
    Then 70 should go to FG at standard cost
    And 5 scrap should post to scrap loss
    And 25 should remain in WIP
    And MO status should be "PARTIAL"
```

---

## US-010 — Auditor: View Anomaly Findings

```gherkin
Feature: Anomaly Review
  
  Scenario: Review high-severity finding
    Given there is an anomaly finding score 95 of type "ROUND_NUMBER_BIAS"
    When I am logged in as "auditor@test.sa"
    And I navigate to /admin/anomalies
    Then I should see the finding at top
    And severity badge should be "Critical"
    When I click the finding
    Then I should see:
      | the pattern detected             |
      | the AI explanation in Arabic     |
      | related transactions             |
      | suggested action                 |
    When I click "Investigate"
    Then a case file should be created
    And I should be able to add notes + attachments
    When I click "Resolve"
    And I select resolution "ACCEPTED_WITH_NOTE"
    Then the finding status should change to "RESOLVED"
    And it should be archived but searchable
```

---

## Template للـ Stories الجديدة

```gherkin
Feature: <Feature Name>
  
  Background:
    Given <preconditions>
  
  Scenario: <Happy path>
    Given <state>
    When <action>
    Then <expected outcome>
  
  Scenario: <Edge case>
    ...
  
  Scenario: <Error case>
    ...
```

## استخدام في CI

```typescript
// e2e/stories/sales-rep-create-invoice.spec.ts
// كل scenario يصير test في Playwright
import { test, expect } from '@playwright/test';

test.describe('Sales Rep: Create Invoice', () => {
  test('Successful invoice creation within credit limit', async ({ page }) => {
    // arrange: seed tenant + customer + product
    await seedFromGherkin('US-001-scenario-1');
    
    // act
    await loginAs(page, 'sales-rep@test.sa');
    await page.goto('/sales/invoices/new');
    // ... fill form
    
    // assert
    await expect(page.locator('[data-status]')).toHaveAttribute('data-status', 'POSTED');
    const je = await fetchJournalForInvoice(invoiceId);
    expect(je).toMatchObject({ /* expected lines */ });
  });
});
```

## القواعد لكتابة User Stories الجديدة

1. INVEST principle (Independent, Negotiable, Valuable, Estimable, Small, Testable)
2. كل scenario له exit criteria محدد
3. لا ambiguity (الأرقام والـ enums واضحة)
4. تغطية: happy path + 1-2 edge cases + 1 error case على الأقل
5. اربط بـ business value (لماذا نحتاج هذه الميزة)
