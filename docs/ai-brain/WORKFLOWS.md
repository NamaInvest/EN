# WORKFLOWS

## 1. Sales Invoice Lifecycle
1. User creates an invoice in the UI.
2. API validates stock availability.
3. `runFinancialTx` triggers:
   a. Stock reduction.
   b. Invoice creation.
   c. GL Journal Entry creation (AR Debit, Revenue Credit).
   d. ZATCA XML Generation (if KSA applicable).

## 2. Purchase Lifecycle
1. PO created.
2. Goods Received Note (GRN) triggers `runInventoryTx`.
3. Invoice matching triggers `runFinancialTx`.

## 3. ZATCA Reporting
1. Invoice finalised.
2. ZATCA service signs XML.
3. API submits to FATOORA portal.
4. Cleared status updated atomically.
