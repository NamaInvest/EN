# 💾 Skill — nama-backup-restore-drill

## Purpose
تخطيط وتنفيذ تحقق آمن من النسخ الاحتياطي والاستعادة واختبار RTO/RPO.

## Allowed Actions
- Design backup policy
- Plan recovery drill scenarios
- Execute local or staging restore verification
- Validate backup integrity signature (sha256)

## Forbidden Actions
- Production DB overwrite
- Live customer data deletion
- Exposing secrets in recovery scripts
- Unapproved backup extraction outside sandbox

## Outputs
- `BACKUP_POLICY.md`
- `BACKUP_RESTORE_DRILL_PLAN.md`
- `BACKUP_RESTORE_DRILL_REPORT.md`

## .ai-brain Updates
- `.ai-brain/01-current-state.md`
- `.ai-brain/09-devops-backup-rollback-dr.md`

## Evidence Tags
- `VERIFIED_BY_REPORT`

## Stop Conditions
- Stop immediately on any live production overwrite or credential exposure.
