# Domain Boundaries

## Accounting Domain
Responsible for:
- Journals
- Ledger
- Period Close
- VAT
- Financial Statements

Cannot directly modify:
- HR
- Inventory physical counts
- CRM

## Inventory Domain
Responsible for:
- Stock movements
- Warehouses
- Transfers
- Costing

Cannot:
- Create accounting entries directly
- Modify customer balances

## Sales Domain
Responsible for:
- Quotations
- Sales Orders
- Invoices

Must use:
- Accounting engine
- Inventory engine
