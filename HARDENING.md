# HARDENING — Outstanding Critical Items

> Tracker for critical fixes after the 35-item AI Stack delivery.
> Updated: 2026-05-07.

This document captures the gap between **scaffolding shipped** and **production-grade**.
Items here are verified failures, not opinions.

---

## ✅ Fixed in this branch (`hardening/critical-fixes-2026-05-07`)

| # | Item | What was wrong | What we did |
|---|---|---|---|
| 1 | `ai-stack.test.ts` did not run | `beforeAll` missing from vitest import | Added `beforeAll` import. Now: **11/11 tests pass**. |
| 2 | `pii-mask.ts` IBAN regex was wrong | Required 18 BBAN chars instead of 20 → real Saudi IBANs (24 chars total) never matched | Fixed regex to `[A-Z0-9]{20}`. |
| 3 | `pii-mask.ts` salary regex was rigid | Only matched when keyword was directly followed by digits ("راتب 1500"), failed on natural Arabic ("راتب الموظف: 15,000") | Allow up to 40 non-digit chars between keyword and number; mask only the number, keep the surrounding text intact. |
| 4 | CI silently passed everything | `lint`, `tsc`, and `vitest` all ended with `\|\| true` | Removed `\|\| true` from lint and test. TypeScript runs in **baseline-aware** mode: fails only if error count rises above the documented baseline (230). |
| 5 | Production deploy used `prisma db push --accept-data-loss` | Could silently drop columns / tables on every deploy | Replaced with `prisma migrate deploy`. Added `set -e`, snapshot of previous commit, post-deploy `/api/health` check, and automatic rollback on failure. |
| 6 | LangChain orchestrator had **1** demo tool only | Audit specified 20 ERP tools | Now exposes **8 tools** wired to the real schema: `get_erp_metrics`, `get_customer_balance`, `get_invoice_by_id`, `search_products`, `get_account_balance`, `list_open_invoices`, `list_pending_approvals`, `get_cash_position`. |
| 7 | Token tracking was hardcoded to `0` | `promptTokens: 0, completionTokens: 0` regardless of actual call | Added `extractTokenUsage()` that reads `usage_metadata` / `response_metadata.tokenUsage` from the LangChain `AIMessage` and logs the real numbers. |

---

## ❌ Still NOT done — production blockers

### H-01 · 230 TypeScript errors (P0)

**Scope.** `npx tsc --noEmit --skipLibCheck` reports **230 errors**. They are hidden in
production by `typescript.ignoreBuildErrors: true` in `next.config.ts`.

**Top error codes (verified by counting):**
| Code | Count | Meaning |
|---|---:|---|
| TS7006 | 59 | Implicit `any` parameter |
| TS2304 | 53 | `Cannot find name 'prisma'` |
| TS1308 | 38 | `await` outside async — top-level await in non-module |
| TS2353 | 31 | Object literal property does not exist on type |
| TS2339 | 12 | Property does not exist on type |
| TS2322 | 10 | Type assignment mismatch |
| TS2561 | 6 | Property typo (e.g., `isActive` vs `active`) |

**Root cause for the dominant 91 errors (TS2304 + TS1308).** A bulk migration moved
many dashboard pages to `'use client'` but left their original Server-Component bodies
intact, including module-level `await prisma.X.findMany()` calls. Examples:

- `src/app/(dashboard)/accounting/dunning/page.tsx`
- `src/app/(dashboard)/accounting/customer-statements/page.tsx`
- `src/app/(dashboard)/accounting/multi-book/page.tsx`
- `src/app/(dashboard)/accounting/year-end-close/page.tsx`
- `src/app/(dashboard)/accounting/payment-runs/page.tsx`
- `src/app/(dashboard)/accounting/vendor-statements/page.tsx`
- `src/app/(dashboard)/admin/security/mfa-audit/page.tsx`
- (~13 more dashboard pages)

These pages **do not work at runtime** — `prisma` cannot run inside a client component.
At best they crash on render; at worst they leak server code to the browser bundle.

**Fix paths (one of):**
1. Drop `'use client'` and let them stay Server Components. Fastest fix, preserves
   data fetching at the edge. Lose any client-only hooks (none of the bodies actually
   use them).
2. Move the queries into a co-located `route.ts` or `actions.ts`, then call from the
   client via `useEffect` + fetch (or, ideally, TanStack Query). More work but enables
   the form/UX hooks the migration was probably aiming for.

**Why we did not bulk-fix here.** Each file needs a deliberate decision (Server vs.
Client) based on what UI behavior it actually needs. A blind sed-style pass would
introduce silent runtime breaks across ~20 financial pages. Track per-file.

**TS2304 / TS1308 file list (full):** run
```sh
npx tsc --noEmit --skipLibCheck 2>&1 | grep -E "TS2304|TS1308" | cut -d: -f1 | sort -u
```

**Acceptance criteria.** TypeScript errors ≤ 50, then flip
`ignoreBuildErrors` to `false`, then drive remaining errors to 0.

---

### H-02 · `vector-store.ts` is not pgvector (P0)

**File:** [src/lib/vector-store.ts](src/lib/vector-store.ts)

**What it claims to be.** RAG layer backed by pgvector with HNSW index.

**What it actually does.**
```ts
const allDocs = await prisma.knowledgeDocument.findMany({ where: { tenantId }, ... });
results.map(...).sort()  // brute-force cosine in app memory
```

It loads **every** `KnowledgeDocument` row for the tenant and runs cosine similarity
in JavaScript. The file even self-acknowledges:
> "Note: This is an in-memory brute force since pgvector is unavailable locally."

**Scaling profile.** Acceptable up to ~5,000 documents/tenant. Above that:
- Latency grows linearly with document count.
- Memory pressure grows with vector dimension × document count (768 × N floats).
- Cost on serverless platforms becomes unbounded.

**Fix.**
1. Migration: `CREATE EXTENSION vector;` then add `embedding vector(768)` column on
   `KnowledgeChunk`.
2. Index: `CREATE INDEX ON "KnowledgeChunk" USING hnsw (embedding vector_cosine_ops);`
3. Query: `ORDER BY embedding <=> $1::vector LIMIT $k` via Prisma `$queryRaw`.
4. Split documents into chunks (size 500, overlap 50) — schema needs `KnowledgeChunk`
   model, not single-doc embeddings.

**Acceptance criteria.** Top-5 query under 50 ms at 100,000 chunks/tenant.

---

### H-03 · `prompt-cache.ts` is not Gemini Context Cache (P0)

**File:** [src/lib/prompt-cache.ts](src/lib/prompt-cache.ts)

**What it claims to be.** Provider-side prompt caching that gives 75% token discount
on repeated prefix.

**What it actually does.** A `Map<string, CacheEntry>` in Node memory.
- Multi-instance broken — each pod has its own cache.
- Doesn't ever talk to Gemini's `createCachedContent({contents, ttl})` API.
- The "savings" reported are imaginary because no `cachedContent` ID is ever sent
  with subsequent requests.

**Fix.** Wrap the actual Gemini Context Cache:
```ts
import { GoogleGenerativeAI } from '@google/generative-ai';
const cache = await genAI.cachedContents.create({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'system', parts: [{ text: systemPrompt }] }],
    ttl: '3600s',
});
// store { cacheKey: cache.name, expiresAt }
// reuse: model.generateContent({ cachedContent: cache.name, contents: ... })
```
And persist the cache record in a `LlmContextCache` Prisma model so all pods share it.

**Acceptance criteria.** Verified 60%+ token cost reduction on the CFO daily summary
flow over a 24-hour period (compare PromptUsageLog before/after).

---

### H-04 · Missing Prisma models from the audit spec (P1)

| Model | Audit ref | Status |
|---|---|---|
| `LlmContextCache` | AI-02 | Not added — required for H-03 |
| `AiToolDefinition` | AI-07 | Not added — tools are hardcoded in code instead |
| `AiToolCallLog` | AI-07 | Not added — tool invocations are not audited |
| `KnowledgeChunk` | AI-15 | Not added — RAG uses one-row-per-doc which is wrong |
| `BudgetDriver` | xP&A | Not added — driver-based budgeting not possible |
| `ConsolidationMember` | P0-02 | Not added — only `ConsolidationGroup` and `ConsolidationRun` exist; can't represent ownership % |
| `EliminationRule` | P0-02 | Not added — consolidation engine has no rule storage |

These are not just nice-to-have — they unblock features already claimed as "shipped".

---

### H-05 · `/api/ai/cost-dashboard` does not exist (P1)

The "AI-22 Cost Dashboard" was claimed. Verified absent:
```sh
$ ls src/app/api/ai-cost-dashboard 2>&1
ls: cannot access ...: No such file or directory
$ ls src/app/api/ai/cost-dashboard 2>&1
ls: cannot access ...: No such file or directory
```

The `PromptUsageLog` table is being written to (after the H-fix-7 token tracking),
but nothing reads it. Dashboard needs an aggregation query + a page to render it.

---

### H-06 · No staging environment (P2)

`ci.yml` deploys directly to production on push to `main`. There is no staging
between green CI and live traffic. With H-fix-5 (rollback on health check failure)
this is survivable for now, but a real staging environment with a smoke-test job
should be added.

---

## How to use this document

When starting a new session, the first thing to do is:

```sh
# Verify the baseline hasn't drifted
npx tsc --noEmit --skipLibCheck 2>&1 | grep -c "error TS"
# Expected: 230 — if higher, the new code introduced regressions.

npx vitest run src/lib/__tests__/ai-stack.test.ts
# Expected: 11/11 pass.
```

Then pick **one** H-item, fix it end-to-end (code + test + docs update), and remove
that section from this file in the same commit.

Do not pick the next item until the previous one's acceptance criteria are met.
