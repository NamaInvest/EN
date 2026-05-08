# 🚀 NamaSoft ERP — Deployment & Operations Guide

## Prerequisites on Production Server

```bash
# Required environment variables (see .env.example)
export JWT_SECRET="$(openssl rand -hex 64)"
export ENCRYPTION_KEY="$(openssl rand -hex 32)"
export DATABASE_URL="postgresql://..."
```

## Initial Deployment

```bash
# 1. Clone and install
git clone https://github.com/your-org/namasoft.git /www/wwwroot/namainvist.com
cd /www/wwwroot/namainvist.com
npm ci --production=false

# 2. Generate Prisma client
npx prisma@5.22.0 generate

# 3. Run DB migrations
npx prisma migrate deploy

# 4. Build
npm run build

# 5. Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
```

## Float → Decimal Migration (CRITICAL — Run Once)

```bash
# Preview what will change
python3 remediation/migrate_decimal.py --dry-run

# Execute (run during low-traffic window)
python3 remediation/migrate_decimal.py --execute

# After migration, regenerate Prisma client
npx prisma db pull
npx prisma generate
npm run build
pm2 reload all
```

## Health Check

```bash
curl https://namainvist.com/api/health
# Should return: {"status":"healthy","checks":{"api":"ok","database":"ok","environment":"ok"}}
```

## Security Checklist

- [ ] JWT_SECRET is unique and ≥ 64 chars
- [ ] ENCRYPTION_KEY is exactly 32 bytes
- [ ] `.env` is NOT in git (check .gitignore)
- [ ] HTTPS/TLS is enabled on all domains
- [ ] `/api/system/reset` → returns 503 (disabled)
- [ ] `/api/seed-company` → returns 503 (disabled)
- [ ] `GET /api/health` returns 200
- [ ] Rate limiting working: 10 failed logins → 429
- [ ] MFA tokens require real TOTP codes

## PM2 Commands

```bash
pm2 list                    # Show all processes
pm2 logs namaweb --lines 50 # Recent logs
pm2 reload namaweb          # Zero-downtime reload
pm2 restart namaweb         # Full restart
pm2 monit                   # Real-time monitoring
```

## Multi-Tenant Domains

| Domain | Instance | Notes |
|--------|----------|-------|
| namainvist.com | main | Primary tenant |
| n1.namainvist.com | n1 | Tenant 1 |
| n11.namainvist.com | n11 | Tenant 11 |

## Rollback

```bash
# Quick rollback via PM2 (keeps last build)
pm2 reload namaweb --update-env

# Full rollback
git log --oneline -5          # Find previous commit
git checkout <commit-hash>
npm run build
pm2 reload namaweb
```
