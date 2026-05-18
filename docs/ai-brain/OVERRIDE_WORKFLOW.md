# Override Workflow

## Overview
The `OverrideContext` workflow is the sole authorized mechanism to bypass a `SOFT_LOCK` on a financial period. It prevents accidental backdating while allowing necessary administrative corrections.

## System Flow

### 1. Client-Side Trigger
- A user attempts to post an invoice or payment to a past date.
- The API responds with `423 Locked` and a `PeriodLockViolation` error detailing that the period is `SOFT_LOCKED`.
- The Frontend UI intercepts this `423` response.
- If the user has `MASTER_ADMIN` rights, the UI displays a "Request Override" modal.

### 2. User Input
- The admin must type a clear `Reason` (minimum 20 characters) and a specific confirmation phrase (e.g., `CONFIRM-SOFT-LOCK-OVERRIDE`).
- This friction ensures the action is deliberate.

### 3. Header Transmission
- The UI resubmits the original POST request, but appends two custom HTTP Headers:
  - `X-Soft-Lock-Override-Reason`
  - `X-Soft-Lock-Confirmation`
- **Security Note:** This data is deliberately kept out of the JSON Body to prevent overlap with standard API schemas and to simplify middleware parsing.

### 4. Server-Side Extraction & Validation
- The API route extracts the headers.
- It invokes `buildOverrideContextFromRequest(req, { tenantId, actorId, actorRole })`.
- The function strictly sources `tenantId`, `actorId`, and `actorRole` from the verified server-side JWT or Session context. It **ignores** any spoofed values.
- If the reason is too short or the confirmation phrase is invalid, the context is voided.

### 5. Execution & Audit
- The valid `OverrideContext` is passed down to `runFinancialTx` and ultimately into the Core Journal Engine (`createJournalEntry`).
- The engine bypasses the `SOFT_LOCK` and executes the financial posting.
- An asynchronous event is dispatched to the `AuditLog` table, permanently recording the bypass event, the exact reason, the user's ID, and the affected transaction ID.
