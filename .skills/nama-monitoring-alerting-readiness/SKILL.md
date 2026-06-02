# 🔔 Skill — nama-monitoring-alerting-readiness

## Purpose
تصميم وربط مراقبة uptime/logs/alerts وصياغة incident response runbooks.

## Allowed Actions
- Design health check matrix
- Create alerting strategies (SMS/Slack/Telegram)
- Outline observability dashboards architecture

## Forbidden Actions
- Registering production environment to active alerting without CFO/CTO approval
- Storing keys in configuration files

## Outputs
- `OBSERVABILITY_AND_ALERTING_PLAN.md`
- `HEALTH_CHECK_MATRIX.md`
- `ALERTING_RUNBOOK.md`

## .ai-brain Updates
- `.ai-brain/01-current-state.md`
- `.ai-brain/09-devops-backup-rollback-dr.md`

## Evidence Tags
- `VERIFIED_BY_REPORT`

## Stop Conditions
- Stop on credential exposure or unapproved production alerts setup.
