# User Stories: Sales

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
