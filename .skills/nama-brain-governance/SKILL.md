# Nama Brain Governance Skill

## Purpose

Keep `.ai-brain/` as the official project memory and evidence registry for Nama Invest ERP.

This skill is responsible for reading reports, extracting verified evidence, updating project state, updating gap/risk/decision/evidence registers, and preventing contradiction between old reports and the current verified state.

## Allowed Actions

- Read project reports.
- Read `.ai-brain/**`.
- Read `tmp/agent-scan-report.md`.
- Write and update `.ai-brain/**`.
- Write governance reports.
- Add evidence entries.
- Add decisions.
- Add risks and gaps.
- Update next actions.
- Mark old reports as archive/claim-only.

## Forbidden Actions

- Runtime code changes.
- Editing `src/**`.
- Editing `prisma/**`.
- Database writes.
- Production access.
- Reading secrets.
- Deploy.
- PM2 restart/reload.
- Git push.
- Git reset/clean.
- Financial posting.
- Any destructive command.

## Inputs

- `*_REPORT.md`
- `*_PLAN.md`
- `tmp/agent-scan-report.md`
- `.ai-brain/**`
- `task.md`
- `walkthrough.md`
- `implementation_plan.md`

## Outputs

- `.ai-brain/01-current-state.md`
- `.ai-brain/15-approval-gates.md`
- `.ai-brain/16-risk-register.md`
- `.ai-brain/17-gap-register.md`
- `.ai-brain/18-decision-log.md`
- `.ai-brain/19-evidence-index.md`
- `.ai-brain/20-next-actions.md`
- `BRAIN_CONSISTENCY_REPORT.md`

## Evidence Tags

Use only:

- `VERIFIED_BY_CODE`
- `VERIFIED_BY_SCHEMA`
- `VERIFIED_BY_TEST`
- `VERIFIED_BY_COMMAND`
- `VERIFIED_BY_REPORT`
- `STRUCTURE_VERIFIED_ONLY`
- `PLAN_ONLY`
- `CLAIMED_ONLY`
- `PARTIAL`
- `NEEDS_EVIDENCE`
- `NOT_VERIFIED`
- `PRODUCTION_NOT_VERIFIED`
- `STOPPED_REQUIRES_EXPLICIT_APPROVAL`

## Required Procedure

1. Read the latest reports.
2. Extract only evidence-backed facts.
3. Reject unsupported claims.
4. Update current state.
5. Update evidence index.
6. Update gaps and risks.
7. Update decisions.
8. Update next actions.
9. Never mark production stable without production verification.
10. Never mark world-class readiness without release gate evidence.

## Stop Conditions

Stop and request explicit approval if the task requires:

- Runtime code changes.
- DB write.
- Migration.
- Deploy.
- Production access.
- Secrets access.
- Financial posting.
- Git push.

## Approval Gates

- `GO_FOR_BRAIN_GOVERNANCE_SCRIPTS_ONLY`
- `GO_FOR_AI_BRAIN_UPDATE_ONLY`
- `GO_FOR_ARCHIVE_OLD_REPORTS_ONLY`
