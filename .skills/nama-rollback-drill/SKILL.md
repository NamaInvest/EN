# 🔄 Skill — nama-rollback-drill

## Purpose
إثبات إمكانية التراجع عن الإصدار أو التبعيات أو الكود أو المهاجرات بنجاح ميداني كامل.

## Allowed Actions
- Plan dependency rollback strategy
- Test git revert commands locally
- Audit database schema compatibility for positive additive syncs
- Plan PM2 zero-downtime rollback drills

## Forbidden Actions
- Destructive migration rollback on live production
- Code changes on VPS without pipeline validation
- Resetting git history on remote branch (`git push --force`)

## Outputs
- `ROLLBACK_PLAYBOOK.md`
- `ROLLBACK_DRILL_PLAN.md`
- `ROLLBACK_DRILL_REPORT.md`

## .ai-brain Updates
- `.ai-brain/01-current-state.md`
- `.ai-brain/09-devops-backup-rollback-dr.md`

## Evidence Tags
- `VERIFIED_BY_REPORT`

## Stop Conditions
- Stop immediately on force pushing changes or initiating destructive migration commands on production.
