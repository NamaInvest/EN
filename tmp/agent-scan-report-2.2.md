# SCAN + PLAN Report
## Phase 2.2: Idempotency & Replay Protection

### 1. Scope & Foci (المجال المتأثر)
- `src/app/api/pos/route.ts` (POS Invoices)
- `src/app/api/purchases/route.ts` (Purchase Receives)
- `src/app/api/manufacturing/work-orders/[id]/route.ts` (Manufacturing Completion)
- `src/app/api/treasury/route.ts` / Payments (Treasury Receipts)

### 2. Root Cause Analysis (سبب المشكلة الجذري)
- **Double Clicks / Client Retries**: Clients clicking "Submit" twice before the UI disables the button.
- **Network Retries / Timeout**: Reverse proxies or browsers automatically retrying an ongoing request if it times out locally.
- **Webhook Replay**: External systems (like Payment Gateways) sending the same payload multiple times.
**Impact**: This leads to Double Journal Entries, Duplicate Inventory Reductions, and Duplicate Receipts without breaking ACID atomicity for each *individual* request.

### 3. Architecture & Impact Analysis
Currently, `schema.prisma` does not have a dedicated `IdempotencyRecord` table. However, the system relies heavily on **Redis** (`ioredis`) for queues and caching (`src/lib/queue/index.ts`, `src/lib/prompt-cache.ts`).
- **Storage Strategy**: We will use Redis as a high-performance distributed lock/Idempotency store. It automatically expires old keys and avoids bloating the SQL database.

### 4. Implementation Plan (خطة التنفيذ)
**Step 1: Create Idempotency Utility (`src/lib/idempotency.ts`)**
- Develop a Redis-backed wrapper that requires an `Idempotency-Key` (UUID) sent from the client header.
- Use Redis `SETNX` (Set if Not eXists) combined with TTL (e.g., 24 hours).
- States:
  - If `SETNX` succeeds -> Process Request -> Update Redis with `{ status: 'completed', response }`.
  - If `SETNX` fails -> Return `409 Conflict` (Already processing) OR return the cached `response` if already completed.
  - If Request fails internally -> `DEL` the key so the client can safely retry.

**Step 2: Safe Patch Implementation (POS Only - Phase 2.2.1)**
- Integrate `idempotency.ts` into `api/pos/route.ts`.
- Expect `x-idempotency-key` in the header.
- Execute POS logic inside the idempotency wrapper.

**Step 3: Verification & Rollout**
- Test duplicate submissions on POS.
- Ensure no duplicate stock movement or accounting journals occur.
- Once verified, rollout to Purchasing, Treasury, and Manufacturing.

### 5. Risks & Rollback
- **Risk**: Redis failure could block requests if we don't handle connection timeouts.
- **Mitigation**: Add a fail-open or clean rejection mechanism if Redis is unreachable. If the client forgets to send the key, we enforce it strictly (Fail-Fast) to prevent silent un-idempotent processing.
- **Rollback**: Simply remove the wrapper and headers logic. No database schema changes are required.
