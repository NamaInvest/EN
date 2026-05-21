# F1 — Architecture Document

## الحالة الحالية
- `BUILD_PACK/01-ARCHITECTURE_MASTER.md` (352 سطر)
- `.ai-brain/01-architecture.md`
- `docs/AI_EXECUTION_STANDARD.md` (الدستور)
- graphify-validated: 9 hub primitives موثقون
- لا C4 model diagrams
- لا formal arc42 doc

## الفجوة (مقابل arc42 / C4 model standard)
- Architecture غير مرئية كـ diagrams
- لا ADRs (Architecture Decision Records) منظمة
- لا quality goals صريحة

## 🎯 Ready Prompt

```
المهمة: Architecture documentation arc42-compliant + C4 diagrams.

السياق:
- 9 hub primitives confirmed بـ graphify
- 607 Prisma models
- Multi-tenant Phase 2
- Hetzner deployment

المخرجات:
1) Master Architecture doc:
   docs/MASTER_PACK/14-architecture/MASTER.md (arc42 format):

   Section 1 — Introduction & Goals
     - Stakeholder map (CFO, Compliance, DevOps, Sales rep, Developer)
     - Quality goals: Saudi compliance > Performance > Security > Usability
     - Acceptance criteria

   Section 2 — Architecture Constraints
     - Technical: Next.js 16, Prisma, Node 22, PostgreSQL 16
     - Organizational: 1 dev team, no MQ, no microservices
     - Conventions: TypeScript strict, Arabic-first UI
     - Regulatory: ZATCA Phase 2, PDPL, SOCPA mandatory

   Section 3 — System Scope & Context (C4 Level 1)
     - Diagram: users + external systems (ZATCA, GOSI, Mudad, Salla, Zid, Gemini)
     - Use Structurizr DSL or Mermaid

   Section 4 — Solution Strategy
     - Multi-tenant Phase 2 (DB per tenant)
     - withRoute wrapper for all APIs
     - Auto-journal engine for accounting
     - Outbox pattern for events

   Section 5 — Building Block View (C4 Level 2 + 3)
     - Container diagram (Next.js, Postgres, Redis, BullMQ, Electron, S3)
     - Component diagrams per module (Accounting, Sales, HR, Manufacturing)
     - Reference .ai-brain/<NN>-<module>.md

   Section 6 — Runtime View
     - Sequence diagrams (Mermaid) for critical flows:
       - User login + MFA
       - Sales invoice → ZATCA submission
       - Payment run → WPS file
       - PDPL DSR fulfillment
       - Period close

   Section 7 — Deployment View (C4 Level 4)
     - Hetzner topology
     - Cloudflare WAF + DNS
     - PM2 process layout
     - Database backups schedule

   Section 8 — Cross-cutting Concepts
     - Security (link to D3)
     - Logging (link to A2/A3)
     - i18n (link to C4)
     - Error handling (apiError pattern)
     - Idempotency (Redis locks)

   Section 9 — Architecture Decisions (ADRs)
     - Link to docs/MASTER_PACK/14-architecture/adrs/

   Section 10 — Quality Requirements
     - Quality scenarios (e.g. "POS handles 50 concurrent transactions")
     - SLA per tier

   Section 11 — Risks & Technical Debts
     - Link to graphify-out/GRAPH_REPORT_FRESH.md
     - DEBT-1, DEBT-5, etc.

   Section 12 — Glossary
     - Link to .ai-brain/47-glossary.md

2) C4 Diagrams (Structurizr):
   docs/MASTER_PACK/14-architecture/workspace.dsl
   Generate:
   - C1 Context
   - C2 Container
   - C3 Component (per module)
   - C4 Code (for critical engines)
   Render to PNG/SVG → embed in MASTER.md

3) ADRs (Architecture Decision Records):
   docs/MASTER_PACK/14-architecture/adrs/
   format: 0001-multi-tenant-strategy.md
           0002-auto-journal-pattern.md
           0003-outbox-pattern.md
           0004-withRoute-wrapper.md
           ... etc.

   كل ADR template:
   ```
   # ADR-0001: Multi-Tenant Strategy
   ## Status: Accepted
   ## Date: 2026-XX-XX
   ## Context: Why we needed to decide
   ## Decision: What we chose
   ## Consequences: Trade-offs (good + bad)
   ## Alternatives Considered: List
   ```

4) Architecture diff alerts:
   .github/workflows/architecture-check.yml:
   - on PR touching src/lib/{prisma,auth,with-route,auto-journal}.ts
   - require architect review tag
   - notify on Slack

القيود:
- diagrams as code (Structurizr/Mermaid) — لا screenshots
- ADRs immutable (no edits, only supersede)
- review quarterly
```

## السيناريو

معماري جديد ينضم للفريق:

**اليوم 1**:
1. يقرأ `docs/AI_EXECUTION_STANDARD.md` (الدستور)
2. يفتح `docs/MASTER_PACK/14-architecture/MASTER.md`
3. يرى C1 Context — يفهم الـ ecosystem
4. يفتح C2 Container — يفهم الـ stack

**اليوم 2**:
5. يقرأ ADRs — يفهم لماذا choices معينة
6. يفتح C3 per module (Accounting/Sales/HR) — يفهم الـ components

**الأسبوع 2**:
7. يبدأ بـ feature صغير
8. لو يحتاج تغيير معماري → ينشئ ADR جديد
9. يفتح PR → architect review مطلوب

**شهر 3**:
10. PR كبير يلمس prisma.ts
11. CI يكتشف → block + notify architects
12. Discussion في PR → architects يقررون

## Data Flow

```
[New developer onboarding]
Day 1: Constitution + AI_EXECUTION_STANDARD
Day 1-2: arc42 MASTER.md
Day 2-3: Module brain (.ai-brain/<NN>-<module>.md)
Day 3: First small feature (with mentor)
Week 2-4: Larger features

[Architecture change flow]
Developer proposes design change
   ↓
Open PR with new ADR file
   ↓
docs/MASTER_PACK/14-architecture/adrs/NNNN-<title>.md
   ↓
GitHub Actions adds reviewers (architect team)
   ↓
Discussion in PR
   ↓
Status: proposed → accepted/rejected
   ↓
If accepted:
   - Update MASTER.md cross-refs
   - Implement in code
   - Archive in adrs/ folder
   ↓
If rejected:
   - Mark superseded by (link to alt ADR)

[Quarterly review]
Q-start meeting:
   - Architects review all ADRs
   - Check still relevant
   - Identify new technical debts
   - Update graphify
   - Refresh MASTER.md sections
   ↓
Output: docs/MASTER_PACK/14-architecture/quarterly-reviews/<YYYY-Q>.md
```

## ملفات المُنتَج

- `docs/MASTER_PACK/14-architecture/MASTER.md` (arc42 12 sections)
- `docs/MASTER_PACK/14-architecture/workspace.dsl` (Structurizr)
- `docs/MASTER_PACK/14-architecture/diagrams/` (PNG/SVG outputs)
- `docs/MASTER_PACK/14-architecture/adrs/NNNN-*.md` × ~30
- `docs/MASTER_PACK/14-architecture/quarterly-reviews/*.md`
- `.github/workflows/architecture-check.yml`
