---
version: 1.0
last_updated: 2026-05-12
owner: Accounting Engine
---

# Auto-Journal Patterns

> كل قيد محاسبي في النظام يمر عبر `src/lib/auto-journal.ts`.
> هذا الملف يوثّق كل سيناريوهاته ومدخلاته ومخرجاته.

## التوقيع العام

```typescript
async function postJournal(
  tx: Prisma.TransactionClient,
  input: PostJournalInput
): Promise<JournalEntry>;

interface PostJournalInput {
  scenario: JournalScenario;
  tenantId: string;
  sourceDocumentId: string;
  sourceDocumentType: string;
  date: Date;
  currency?: string;          // default tenant base
  fxRate?: number;            // required if currency != base
  lines: JournalLineInput[];
  postImmediately?: boolean;  // default true
  memo?: string;
}

interface JournalLineInput {
  accountId: string;
  debit: number;              // 0 if credit line
  credit: number;             // 0 if debit line
  costCenterId?: string;
  profitCenterId?: string;
  segmentId?: string;
  projectId?: string;
  partnerType?: 'CUSTOMER' | 'VENDOR' | 'EMPLOYEE';
  partnerId?: string;
  taxCode?: string;
  memo?: string;
}
```

## السيناريوهات الـ40+ المدعومة

### مبيعات

#### `SALES_INVOICE`
```
DR  Accounts Receivable (Customer Control)   = subtotal + vat
CR  Revenue (per item)                       = subtotal
CR  VAT Output                               = vat
DR  Cost of Goods Sold                       = qty × moving_avg_cost
CR  Inventory                                = qty × moving_avg_cost
```

#### `SALES_RETURN`
```
DR  Sales Returns                            = subtotal
DR  VAT Output (reversal)                    = vat
CR  Accounts Receivable                      = subtotal + vat
DR  Inventory                                = qty × original_cost
CR  Cost of Goods Sold (reversal)            = qty × original_cost
```

#### `POS_SALE_CASH`
```
DR  Cash on Hand                             = total
CR  Revenue                                  = subtotal
CR  VAT Output                               = vat
DR  COGS / CR Inventory                      (same as SALES_INVOICE)
```

#### `POS_SALE_CARD`
```
DR  Card Settlement Pending                  = total
CR  Revenue + VAT (same)
+ COGS journal
```

#### `POS_SETTLEMENT`
```
DR  Bank Account                             = settled amount
DR  Card Fees Expense                        = MDR
CR  Card Settlement Pending                  = total
```

#### `INSTALLMENT_BILLING`
```
DR  Accounts Receivable (Long-term)          = full amount
CR  Deferred Revenue                         = principal portion
CR  Deferred Interest Income                 = interest portion
```

#### `INSTALLMENT_RECEIVE`
```
DR  Bank                                     = installment
CR  AR Long-term                             = installment

# Recognition piece:
DR  Deferred Revenue / Interest Income       = period portion
CR  Revenue / Interest Income                = period portion
```

#### `LOYALTY_POINTS_AWARDED`
```
DR  Loyalty Marketing Expense                = points × point_value
CR  Loyalty Liability                        = points × point_value
```

#### `LOYALTY_POINTS_REDEEMED`
```
DR  Loyalty Liability                        = points redeemed × value
CR  Revenue (or as discount)                 = same
```

#### `GIFT_CARD_SOLD`
```
DR  Cash/Bank                                = amount
CR  Gift Card Liability                      = amount
(no revenue yet — IFRS 15)
```

#### `GIFT_CARD_REDEEMED`
```
DR  Gift Card Liability                      = amount
CR  Revenue                                  = subtotal
CR  VAT Output                               = vat
+ COGS journal
```

#### `SUBSCRIPTION_BILLED`
```
DR  AR                                       = period billing
CR  Deferred Revenue (Contract Liability)    = period billing
(unless service already delivered → direct revenue)
```

#### `SUBSCRIPTION_RECOGNIZED_DAILY`
```
DR  Deferred Revenue                         = daily portion
CR  Revenue                                  = daily portion
(automated via cron — recurring-billing-engine)
```

### مشتريات

#### `PURCHASE_INVOICE` (with inventory item)
```
DR  Inventory (or Expense)                   = subtotal
DR  VAT Input                                = vat
CR  Accounts Payable                         = subtotal + vat
```

#### `PURCHASE_INVOICE_FOREIGN_VENDOR` (WHT applicable)
```
DR  Expense                                  = subtotal
DR  VAT Input                                = vat (if applicable)
CR  AP                                       = subtotal + vat - wht
CR  WHT Payable                              = subtotal × wht_rate
```

#### `PURCHASE_INVOICE_REVERSE_CHARGE_VAT` (imports)
```
DR  Inventory/Expense                        = subtotal
DR  VAT Input                                = subtotal × 15%
CR  VAT Output (self-assessed)               = subtotal × 15%
CR  AP                                       = subtotal
```

#### `GRN_RECEIVED_BEFORE_INVOICE` (3-way match)
```
DR  Inventory                                = qty × po_price
CR  GR/IR Clearing                           = qty × po_price
```

#### `PURCHASE_INVOICE_MATCHED_TO_GRN`
```
DR  GR/IR Clearing                           = qty × po_price
DR  Inventory Price Variance (if any)        = diff
DR  VAT Input                                = vat
CR  AP                                       = qty × actual_price + vat
```

#### `PURCHASE_RETURN`
```
DR  AP                                       = subtotal + vat
CR  Inventory/Expense (reversal)             = subtotal
CR  VAT Input (reversal)                     = vat
```

#### `LANDED_COST_APPLIED`
```
DR  Inventory                                = freight + duty + insurance
CR  Cash/AP (per cost component)             = same
```

### مدفوعات وتحصيلات

#### `PAYMENT_RECEIPT_FROM_CUSTOMER`
```
DR  Bank                                     = received
CR  AR                                       = received
```

#### `PAYMENT_RECEIPT_PARTIAL_WITH_DISCOUNT`
```
DR  Bank                                     = received
DR  Sales Discounts                          = discount
CR  AR                                       = received + discount
```

#### `PAYMENT_DISBURSEMENT_TO_VENDOR`
```
DR  AP                                       = paid
CR  Bank                                     = paid - bank_fee
CR  Bank Fees Expense (if any)               = bank_fee
```

#### `CHECK_ISSUED`
```
DR  AP                                       = check amount
CR  Outstanding Checks                       = check amount
```

#### `CHECK_CLEARED`
```
DR  Outstanding Checks                       = amount
CR  Bank                                     = amount
```

#### `CHECK_BOUNCED`
```
DR  AP (reversal)                            = amount
DR  Bank Charges                             = bounce fee
CR  Bank                                     = bounce fee
CR  Outstanding Checks (reversal)            = amount
```

### رواتب

#### `WAGE_PAYROLL_ACCRUAL`
```
DR  Wage Expense                             = gross × employees
CR  Wages Payable                            = net
CR  GOSI Payable (employee 9%)               = gosi
CR  WHT Payable (if foreign emp)             = wht
CR  Loan Deduction Liability                 = loan
CR  Other Deductions                         = other
```

#### `EMPLOYER_GOSI_ACCRUAL`
```
DR  Employer GOSI Expense                    = 9% + 2% SANED
CR  GOSI Payable                             = same
```

#### `WAGES_PAID_VIA_WPS`
```
DR  Wages Payable                            = net
CR  Bank                                     = net
```

#### `EOS_ACCRUAL`
```
DR  EOS Expense                              = monthly accrual per employee
CR  EOS Liability                            = same
```

#### `EOS_SETTLEMENT`
```
DR  EOS Liability                            = computed payout
CR  Bank                                     = same
(any over/under → P&L adjustment)
```

#### `EMPLOYEE_LOAN_GRANTED`
```
DR  Employee Loan Receivable                 = amount
CR  Bank                                     = amount
```

#### `EMPLOYEE_LOAN_DEDUCTED_FROM_SALARY`
```
(during WAGE_PAYROLL_ACCRUAL — see above)
DR  Wages Payable (reduced)
CR  Employee Loan Receivable                 = installment
```

### أصول ثابتة

#### `ASSET_ACQUISITION`
```
DR  Fixed Asset                              = cost
DR  VAT Input (if recoverable)               = vat
CR  Bank/AP                                  = total
```

#### `MONTHLY_DEPRECIATION`
```
DR  Depreciation Expense                     = monthly portion
CR  Accumulated Depreciation                 = same
```

#### `ASSET_DISPOSAL_GAIN`
```
DR  Bank/AR (sale proceeds)                  = proceeds
DR  Accumulated Depreciation                 = accumulated
CR  Fixed Asset                              = original cost
CR  Gain on Disposal                         = diff
```

#### `ASSET_DISPOSAL_LOSS`
```
DR  Bank/AR (sale proceeds)                  = proceeds
DR  Accumulated Depreciation                 = accumulated
DR  Loss on Disposal                         = diff
CR  Fixed Asset                              = original cost
```

#### `ASSET_REVALUATION_GAIN`
```
DR  Fixed Asset                              = revaluation gain
CR  Revaluation Surplus (OCI)                = same
```

#### `ASSET_IMPAIRMENT`
```
DR  Impairment Loss                          = (carrying - recoverable)
CR  Accumulated Impairment                   = same
```

#### `ARO_ACCRETION`
```
DR  ARO Accretion Expense                    = period × rate × liability
CR  ARO Liability                            = same
```

### Period-End

#### `FX_REVALUATION_UNREALIZED`
```
DR  Unrealized FX Loss (or CR Gain)          = (open balance × new rate) - book value
CR  AR/AP foreign                            = same
```

#### `FX_REVALUATION_REALIZED` (on settlement)
```
DR  Bank (settled)
CR  AR foreign (book)
DR/CR  Realized FX Gain/Loss                 = difference
```

#### `ACCRUAL_ENTRY`
```
DR  Expense (specific)                       = accrued amount
CR  Accrued Liability                        = same
(reversed on first day of next period)
```

#### `DEFERRAL_ENTRY`
```
DR  Prepaid Expense                          = upfront paid
CR  Cash (already booked)
+ monthly amortization:
DR  Expense
CR  Prepaid Expense
```

#### `BAD_DEBT_PROVISION_ECL` (IFRS 9)
```
DR  Bad Debt Expense                         = ECL movement
CR  Allowance for Doubtful Accounts          = same
```

#### `BAD_DEBT_WRITE_OFF`
```
DR  Allowance for Doubtful Accounts          = amount
CR  AR                                       = same
```

### تصنيع

#### `MO_MATERIAL_ISSUE`
```
DR  WIP (work in process)                    = materials × cost
CR  Raw Materials                            = same
```

#### `MO_LABOR_ABSORBED`
```
DR  WIP                                      = hours × rate
CR  Labor Absorption (clearing)              = same
(actual wages booked separately to wage expense)
```

#### `MO_OVERHEAD_ABSORBED`
```
DR  WIP                                      = absorbed
CR  Overhead Absorption (clearing)           = same
```

#### `MO_COMPLETED`
```
DR  Finished Goods                           = standard cost × qty
CR  WIP                                      = (or actual if Actual Costing)
```

#### `MO_VARIANCE`
```
DR  Material/Labor/Overhead Variance         = actual - standard
CR  WIP (or vice versa)
```

#### `SCRAP_WRITE_OFF`
```
DR  Scrap Loss                               = scrap qty × cost
CR  WIP / FG                                 = same
```

### Period Close Automation

#### `CLOSING_ENTRY` (Year-End)
```
# Revenue accounts → IS Summary
DR  Revenue                                  = balance
CR  Income Summary                           = balance

# Expense accounts → IS Summary
DR  Income Summary                           = balance
CR  Expenses                                 = balance

# Income Summary → Retained Earnings
DR  Income Summary                           = net income
CR  Retained Earnings                        = net income
```

#### `INTER_COMPANY_ELIMINATION`
```
DR  IC Revenue                               = sold to subsidiary
CR  IC COGS                                  = same
+ IC AR / IC AP eliminations
+ unrealized profit in inventory elimination
```

#### `MULTI_BOOK_ADJUSTMENT` (IFRS ↔ local GAAP)
```
DR/CR  GAAP Adjustment (specific account)
DR/CR  Counter account
(per book — primary vs IFRS book)
```

## القواعد التحكيمية في `auto-journal.ts`

```typescript
// 1. Balance check
const drSum = lines.reduce((s, l) => s + l.debit, 0);
const crSum = lines.reduce((s, l) => s + l.credit, 0);
if (Math.abs(drSum - crSum) > 0.01) throw new Error('Unbalanced');

// 2. Control account guard
for (const line of lines) {
  if (account.isControl && input.scenario === 'MANUAL') {
    throw new Error('Cannot manually post to control account');
  }
}

// 3. Period lock
const period = await getPeriodForDate(input.date);
if (period.status === 'CLOSED' && !input.allowClosedPeriod) {
  throw new Error('Period closed');
}

// 4. Cost center required
for (const line of lines) {
  if (account.requiresCostCenter && !line.costCenterId) {
    throw new Error(`CC required for ${account.code}`);
  }
}

// 5. Currency consistency
if (input.currency && input.currency !== tenantBase && !input.fxRate) {
  throw new Error('FX rate required for non-base currency');
}

// 6. Numbering
const code = await nextSequence(tx, input.tenantId, 'JOURNAL_ENTRY');

// 7. Audit
await fieldAuditLog({
  entity: 'JournalEntry',
  entityId: je.id,
  action: 'CREATED',
  actorId: ctx.userId,
});
```
