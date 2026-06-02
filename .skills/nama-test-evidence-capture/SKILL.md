# 📸 Skill — nama-test-evidence-capture

## Purpose
التقاط الأدلة الخام لاختبارات Jest/Vitest/TypeScript/Prisma بدل الاعتماد على الادعاءات (claims).

## Allowed Actions
- Execute test commands
- Capture shell outputs and dump them to raw reports
- Audit exit codes of verification tasks

## Forbidden Actions
- Hiding test failures
- Production changes
- Modifying test logic to fake success

## Required Commands
- `npm run typecheck`
- `npx prisma validate`
- `npm run test:unit`
- `npm run test:coverage`

## Outputs
- `FULL_TEST_RAW_EVIDENCE_REPORT.md`
- `JEST_RAW_OUTPUT_SUMMARY.md`
- `VITEST_RAW_OUTPUT_SUMMARY.md`
- `TYPECHECK_RAW_OUTPUT_SUMMARY.md`
- `PRISMA_VALIDATE_RAW_OUTPUT_SUMMARY.md`

## .ai-brain Updates
- `.ai-brain/01-current-state.md`
- `.ai-brain/03-quality-and-testing.md`

## Evidence Tags
- `VERIFIED_BY_COMMAND`
- `VERIFIED_BY_TEST`

## Stop Conditions
- Failures must not be redacted. Any command exit code != 0 is logged as failure.
