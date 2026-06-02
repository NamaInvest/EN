# 🩺 Skill — nama-production-health-read-only

## Purpose
فحص صحة خادم الإنتاج قراءة فقط بدون reload أو DB writes أو Deploy أو restart.

## Allowed Commands (Later under separate gates)
- `pm2 status`
- `pm2 describe <app>`
- `pm2 logs <app> --lines 100 --nostream`
- `curl -I https://domain`
- `df -h`
- `free -m`
- `uptime`

## Forbidden Actions
- `pm2 restart`
- `pm2 reload`
- `git pull`
- `npm install`
- `npm run build`
- `prisma migrate`
- `prisma db push`
- `systemctl restart`
- `nginx -s reload`

## Outputs
- `PRODUCTION_HEALTH_READ_ONLY_REPORT.md`
- `PM2_STATUS_READ_ONLY_REPORT.md`
- `PRODUCTION_LOGS_REDACTED_REPORT.md`

## .ai-brain Updates
- `.ai-brain/01-current-state.md`
- `.ai-brain/09-devops-backup-rollback-dr.md`

## Evidence Tags
- `VERIFIED_BY_COMMAND`
- `PRODUCTION_NOT_VERIFIED` (in early planning phases)

## Stop Conditions
- Any write, restart, pull, reload, or deploy command stops the tool.
