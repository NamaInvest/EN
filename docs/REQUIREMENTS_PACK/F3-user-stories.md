# F3 — User Stories & Acceptance Criteria

## الحالة الحالية
- `docs/MASTER_PACK/12-user-stories/` (1 ملف فقط في graphify)
- `docs/user-stories/sample-user-stories.md` يحوي **192 BDD stories** عبر 11 module ✓
- لكن غير مرتبطة بـ API/tests
- لا Jira/Linear integration

## الفجوة (مقابل SAP يملك 5000+ stories لكل ميزة)
- لا story لكل route من 848
- لا acceptance criteria formal
- لا linkage to tests + designs
- لا estimation methodology

## 🎯 Ready Prompt

```
المهمة: User stories consolidation + ربط شامل.

السياق:
- 192 stories موجودة في docs/user-stories/sample-user-stories.md
- 11 modules مغطاة جزئياً
- 167 API section يحتاجون stories
- 4 roles رئيسية: admin, accountant, sales_rep, hr_officer

المخرجات:
1) Consolidation:
   scripts/consolidate-stories.ts:
   - Read docs/user-stories/sample-user-stories.md
   - Split per module → docs/MASTER_PACK/12-user-stories/<module>.md
   - Index file: docs/MASTER_PACK/12-user-stories/INDEX.md

2) Generate missing stories:
   For each API endpoint without a story:
   استخدم Agent من Claude Code:

   ```
   Generate user stories for /api/<module>/<endpoint>:
   - openapi.json contract
   - .ai-brain/<NN>-<module>.md للسياق
   - .ai-brain/03-auth-permissions.md للأدوار

   Format per story:
   US-<module>-<NN>: <action title>
     As a <role>
     I want to <action>
     So that <business value>

     Acceptance Criteria (Gherkin):
       Given <precondition>
       When <action>
       Then <outcome>
       And <side effect>

     Edge cases (3-5)
     Non-functional: latency, isolation, audit
     Compliance: ZATCA|GOSI|SOCPA|PDPL applicable
     Linked: openapi.path | Prisma.model | UI route | tests/

   Min 8 stories per CRUD module, 15 per workflow module.
   Target: 1670+ stories total (167 modules × 10 avg)
   ```

3) Story → artifact linker:
   scripts/link-stories.ts:
   For each story:
   - Find openapi.json path → link
   - Find Prisma models referenced → link
   - Find UI page → link
   - Find tests → link
   ↓
   Update story markdown with backlinks

4) Estimation system:
   docs/MASTER_PACK/12-user-stories/ESTIMATION.md:
   - Story points methodology (Fibonacci: 1,2,3,5,8,13,21)
   - Reference stories: "1 = simple CRUD", "5 = workflow with approvals"
   - Velocity tracking per sprint
   - Burndown chart in /admin/sprint-progress

5) Jira/Linear integration:
   scripts/sync-stories-to-jira.ts:
   - Push each story as Jira ticket
   - Maintain bi-directional sync
   - Story status: backlog/todo/in-progress/review/done

6) Acceptance test mapping:
   Every story MUST have:
   - tests/<module>/<US-id>.test.ts (unit)
   - e2e/<module>/<US-id>.spec.ts (if user-facing)

7) Stakeholder dashboard:
   src/app/(dashboard)/admin/stories/page.tsx:
   - Filter by module/status/role
   - Acceptance criteria preview
   - Linked artifacts (API/test/UI)
   - Markdown editor for new stories

القيود:
- كل story لها story_id فريد (US-<module>-<NN>)
- Gherkin syntax مُلتزم
- linked artifacts moq verify (لا dead links)
- velocity tracked per sprint
```

## السيناريو

PM يحضّر sprint جديد:

1. يفتح `/admin/stories`
2. يفلتر: module=hr, status=backlog
3. يرى 15 story جاهزة + estimation
4. يختار 8 لـ Sprint 12 (total points = 34)
5. كل story له:
   - acceptance criteria واضحة
   - API endpoint محدد
   - test files المتوقعة
   - UI screen المتعلق
6. PM يدفع للـ Jira (auto via script)
7. Developers يبدأون

Developer يستلم story US-hr-12:
1. يفتحها → يرى Gherkin scenarios
2. يكتب test stub:
   ```typescript
   describe('US-hr-12: Process leave request', () => {
     it('GIVEN employee has 15 vacation days', ...);
     it('WHEN they request 5 days', ...);
     it('THEN balance becomes 10', ...);
     // Edge cases
     it('rejects if balance < requested', ...);
   });
   ```
3. يكتب implementation حتى tests pass
4. PR opened → linked to US-hr-12 (auto)
5. Reviewer يفتح story → يرى المتطلبات
6. Acceptance test في PR يطابق الـ AC
7. Merge ✓

## Data Flow

```
[Story creation flow]
PM identifies need
   ↓
Opens /admin/stories → "New Story"
   ↓
Fills template:
   - module, role
   - action, value
   - acceptance criteria (Gherkin)
   - edge cases
   - estimation (story points)
   ↓
Save → US-<module>-<auto-next-NN>
   ↓
scripts/link-stories.ts auto-finds:
   - openapi.json paths
   - Prisma models
   - existing tests
   ↓
Story stored in docs/MASTER_PACK/12-user-stories/<module>.md
   ↓
Auto-pushed to Jira (if integrated)

[Sprint flow]
PM selects stories for sprint
   ↓
Total story points calculated
   ↓
Compare to team velocity (last 3 sprints avg)
   ↓
If overcommit → warning
   ↓
Sprint created in /admin/sprint-progress
   ↓
Daily standup:
   developers update story status
   ↓
End of sprint:
   - Retrospective
   - Velocity recorded
   - Burndown chart

[Development flow]
Developer picks US-<id>
   ↓
Updates status: in-progress
   ↓
Writes test stub matching Gherkin
   ↓
Implements
   ↓
Opens PR with "Resolves US-<id>" in title
   ↓
CI auto-links PR to story
   ↓
Reviewer sees full context
   ↓
Merge → story status = done
   ↓
Velocity counter ++
```

## ملفات المُنتَج

- `scripts/consolidate-stories.ts`
- `scripts/link-stories.ts`
- `scripts/sync-stories-to-jira.ts`
- `docs/MASTER_PACK/12-user-stories/INDEX.md`
- `docs/MASTER_PACK/12-user-stories/<module>.md` × 11 (consolidated) + new
- `docs/MASTER_PACK/12-user-stories/ESTIMATION.md`
- `src/app/(dashboard)/admin/stories/page.tsx`
- `src/app/(dashboard)/admin/sprint-progress/page.tsx`
- `prisma/schema.prisma` — Story, Sprint, SprintStory models (new)
