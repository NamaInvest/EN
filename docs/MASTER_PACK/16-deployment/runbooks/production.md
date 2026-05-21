# Production Runbook

## Overview
This runbook details the exact steps for deploying to the Namasoft ERP Production environment (Hetzner VPS, `46.4.188.170`).

## Prerequisites
- Merged PR to `main` branch.
- Passed all CI checks (Lint, Typecheck, Unit Tests).
- A valid Git Tag (e.g. `v2.5.0`).
- Two approvals on GitHub.

## Deployment Steps
1. Create a release tag on GitHub or locally and push:
   `git tag v2.5.0 && git push origin v2.5.0`
2. GitHub Actions will automatically trigger `.github/workflows/blue-green-deploy.yml`.
3. Wait for the pipeline to build the Docker image and deploy to the Green environment.
4. The pipeline will run smoke tests.
5. If successful, Cloudflare DNS will be swapped to the new VPS IP.

## Rollback Procedure (If Error Spike)
If the new deployment causes > 2% error rate or severe latency:
1. **Option A (DNS Swap - Fastest):**
   Execute `scripts/rollback.sh` to swap Cloudflare DNS back to the Blue environment IP.
2. **Option B (PM2 Revert):**
   SSH into the server and run `pm2 update` with the previous image hash.

## Monitoring Post-Deployment
- Monitor Sentry for new errors for at least 1 hour.
- Watch Grafana dashboard for API latency (p95 should be < 500ms).
- Ensure scheduled cron jobs are executing successfully.
