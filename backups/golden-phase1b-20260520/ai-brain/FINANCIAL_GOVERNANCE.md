# Financial Governance

## Core Principles
Nama Invest is designed as an Enterprise Resource Planning (ERP) system heavily constrained by strict financial accounting standards. Every module (HR, Manufacturing, Sales, Procurement) ultimately interfaces with the General Ledger.

## The 5 Pillars of Financial Governance

### 1. Double-Entry Strictness
Every financial event MUST generate a balanced journal entry. The system explicitly prevents saving unbalanced entries at the database level. If Debits ≠ Credits, the transaction rolls back.

### 2. Transactional Atomicity
A business operation (e.g., fulfilling an order) involves reducing inventory, increasing accounts receivable, and calculating Cost of Goods Sold (COGS). These operations are wrapped in a single database transaction (`runFinancialTx`). If any sub-step fails (e.g., inventory hits zero and negative stock is disabled), the entire operation rolls back. There are no "partial" states.

### 3. FX Realization Automation
Foreign exchange operations automatically calculate realized gains or losses at the time of payment application. The system applies a strict `0.01` materiality threshold. Discrepancies below this threshold are ignored, while material discrepancies dynamically spawn atomic FX Adjustment journal entries bound directly to the payment transaction.

### 4. Financial Period Locks
As detailed in the `PERIOD_LOCKING_AND_OVERRIDE_POLICY`, historical data cannot be altered arbitrarily. Months that are closed (`HARD_LOCKED`) are immutable, ensuring that finalized tax reports match the database indefinitely.

### 5. Idempotency 
Network latency can cause users to click "Submit Payment" twice. Redis-backed idempotency keys (`x-idempotency-key`) ensure that a financial mutation is processed exactly once. Duplicate requests are intercepted at the edge and safely rejected without affecting the ledger.
