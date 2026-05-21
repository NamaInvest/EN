# Disaster Recovery Plan

## Objectives
- **RPO (Recovery Point Objective)**: 1 hour. Achieved via hourly automated PostgreSQL snapshots and WAL shipping to S3-compatible storage.
- **RTO (Recovery Time Objective)**: 30 minutes. Achieved via Terraform infrastructure as code (IaC) and automated deployment pipelines.

## Critical Systems
1. PostgreSQL Database
2. Redis Cache
3. Next.js / Express Monolith
4. Meilisearch / Vector Store

## Backup Strategy
- **Database**: Hourly automated snapshots (Hetzner Volumes) + Continuous WAL archiving via pgBackRest.
- **File Storage**: Daily sync to off-site S3 bucket.
- **Infrastructure**: All configurations stored in `infra/terraform`.

## Failover Procedure
1. If the primary region (fsn1) goes down, Ops receives an alert via Synthetic Monitoring.
2. Ops triggers `terraform apply` with a different region parameter.
3. Database is restored from the latest snapshot using `dr-runbook.md`.
4. Cloudflare DNS is pointed to the new IP address.
5. System is verified via the `/api/health` endpoint.

## Testing Schedule
- **Monthly**: Tabletop review of DR runbook.
- **Quarterly**: Full technical failover drill to a staging environment to ensure RTO/RPO limits are met.
