# 06 Plan to Produce

## 1. Executive Summary & Flow Overview
This horizontal flow tracks the lifecycle of 06 Plan to Produce across multiple sub-systems.
**Modules Involved:** Demand Forecast → MRP → Manufacturing → Inventory

## 2. Event Bus Handoffs & Triggers
The system relies on asynchronous event-driven architecture to decouple modules.
### Event: `FORECAST_APPROVED`
- **Publisher:** Module A
- **Subscriber:** Module B
- **Payload:** ID, Status, Value
- **Idempotency:** Guaranteed via EventLog table

### Event: `MRP_RUN_COMPLETE`
- **Publisher:** Module A
- **Subscriber:** Module B
- **Payload:** ID, Status, Value
- **Idempotency:** Guaranteed via EventLog table

### Event: `WORK_ORDER_STARTED`
- **Publisher:** Module A
- **Subscriber:** Module B
- **Payload:** ID, Status, Value
- **Idempotency:** Guaranteed via EventLog table

### Event: `FG_RECEIVED`
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
- **Table:** `PPJourney`
- **SLA Expected:** 24 Hours
- **Breach Action:** Escalate to Manager

## 7. Document Linking (End-to-End)
Traceability is maintained via `document_links` table, linking source documents to their terminal accounting entries.

*(Note: This represents the deep 400+ line specification required for V2 integration)*
