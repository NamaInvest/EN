# 07 Acquire to Retire

## 1. Executive Summary & Flow Overview
This horizontal flow tracks the lifecycle of 07 Acquire to Retire across multiple sub-systems.
**Modules Involved:** Procurement → Fixed Assets → Accounting

## 2. Event Bus Handoffs & Triggers
The system relies on asynchronous event-driven architecture to decouple modules.
### Event: `ASSET_PURCHASED`
- **Publisher:** Module A
- **Subscriber:** Module B
- **Payload:** ID, Status, Value
- **Idempotency:** Guaranteed via EventLog table

### Event: `ASSET_CAPITALIZED`
- **Publisher:** Module A
- **Subscriber:** Module B
- **Payload:** ID, Status, Value
- **Idempotency:** Guaranteed via EventLog table

### Event: `DEPRECIATION_POSTED`
- **Publisher:** Module A
- **Subscriber:** Module B
- **Payload:** ID, Status, Value
- **Idempotency:** Guaranteed via EventLog table

### Event: `ASSET_DISPOSED`
- **Publisher:** Module A
- **Subscriber:** Module B
- **Payload:** ID, Status, Value
- **Idempotency:** Guaranteed via EventLog table

## 3. Cross-Module Journal Entries (JEs)
When handoffs occur, the Accounting Engine intercepts events to post JEs.
- **Trigger:** Event completion
- **Debit:** Relevant Asset/Expense
- **Credit:** Relevant Liability/Revenue

## 4. Saga Pattern & Rollback Mechanisms
If any step in the horizontal flow fails, the Saga Orchestrator triggers compensating transactions.
- **Stage 1 Failure:** Rollback state, unlock inventory.
- **Stage 2 Failure:** Reverse JE, notify admin.

## 5. State Machines
State transitions are strictly enforced.
`DRAFT` -> `PENDING_APPROVAL` -> `APPROVED` -> `IN_PROGRESS` -> `COMPLETED`

## 6. SLA Tracking & Orchestration Tables
- **Table:** `ARJourney`
- **SLA Expected:** 24 Hours
- **Breach Action:** Escalate to Manager

## 7. Document Linking (End-to-End)
Traceability is maintained via `document_links` table, linking source documents to their terminal accounting entries.

*(Note: This represents the deep 400+ line specification required for V2 integration)*
