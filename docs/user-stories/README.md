# Enterprise User Stories & Acceptance Criteria

This directory contains the fully documented, BDD-style (Behavior-Driven Development) User Stories and Acceptance Criteria for the Nama Invest ERP.

## Overview
- **Total Stories:** 192
- **Framework:** Gherkin (Given/When/Then)
- **Compliance:** SOCPA, ZATCA Phase 2, GOSI, Saudi VAT

## Distribution by Module
- **accounting**: 22 stories
- **sales**: 22 stories
- **inventory**: 14 stories
- **hr-payroll**: 14 stories
- **manufacturing**: 14 stories
- **treasury**: 22 stories
- **assets**: 14 stories
- **procurement**: 22 stories
- **ai-rag**: 17 stories
- **tenant-security**: 17 stories
- **compliance-zatca-gosi-socpa**: 14 stories

## Top 10 Functional Risks
1. **Cross-Tenant Leakage**: Attempting to read/write records belonging to another tenant.
2. **Period Lock Bypass**: Attempting to post financial records to a closed accounting period.
3. **Double Spending / Duplicate Posting**: Re-submitting the same payment or journal.
4. **ZATCA Clearance Failure**: Inability to reach ZATCA API while local transaction commits.
5. **Inventory Negative Stock**: Concurrency issues allowing stock to dip below zero.
6. **Orphaned Outbox Events**: Events failing to process, leaving external systems out of sync.
7. **Idempotency Failure**: API retries causing multiple database side-effects.
8. **RBAC Escalation**: Users bypassing UI to hit APIs they are not authorized for.
9. **Decimal Precision Loss**: Floating point inaccuracies in tax or ledger calculations.
10. **Race Conditions in Approvals**: Two managers approving the same document simultaneously.

## Next Phase Transition (Phase 3: Test Coverage)
The stories marked as "Sensitive" (Accounting, Treasury, Sales) and all "Edge Cases" must be converted into automated integration tests in Phase 3.
