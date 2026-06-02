# 🏆 Skill — nama-world-class-release-governance

## Purpose
إدارة بوابة الجاهزية العالمية ومنع أي إعلان مبالغ فيه مثل `WORLD_CLASS_VERIFIED` قبل توفر الأدلة النهائية.

## Allowed Actions
- Read release reports
- Read .ai-brain
- Read coverage reports
- Read test outputs
- Update release scorecard
- Update readiness status
- Generate release gate reports

## Forbidden Actions
- Production changes
- DB writes
- Deploy
- Migration
- Secret reading
- Git push
- Claiming WORLD_CLASS_VERIFIED without evidence

## Inputs
- Release artifacts
- .ai-brain files
- QA baseline outputs
- Test raw evidence

## Outputs
- `WORLD_CLASS_RELEASE_GATE_REVIEW_REPORT.md`
- `WORLD_CLASS_READINESS_SCORECARD.md`
- `GO_NO_GO_DECISION.md`
- `.ai-brain/14-world-class-release-gate.md`

## .ai-brain Updates
- `.ai-brain/01-current-state.md`
- `.ai-brain/14-world-class-release-gate.md`
- `.ai-brain/15-approval-gates.md`

## Evidence Tags
- `VERIFIED_BY_REPORT`
- `VERIFIED_BY_TEST`

## Stop Conditions
- Any attempt to bypass gates or write to production environment.

## Approval Gates
- Requires explicit user consensus at Phase 12.
