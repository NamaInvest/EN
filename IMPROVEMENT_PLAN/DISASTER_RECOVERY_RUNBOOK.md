# Disaster Recovery Runbook — Namasoft ERP

## Objectives
- **RTO (Recovery Time Objective):** 1 hour
- **RPO (Recovery Point Objective):** 6 hours (worst case)

## Architecture Details
- **Primary Database:** PostgreSQL 16 (on Hetzner VPS)
- **Backup Strategy:** `pgBackRest` configured with AWS S3 / B2 integration
- **Retention Policy:** 7 days Full, 14 days Diff, continuous WAL archiving

---

### Scenario 1: Single Tenant Data Corruption
**Symptom:** A specific tenant's data is corrupted or accidentally deleted.
**Action:**
1. Identify the affected `tenant_id`.
2. Find the latest valid backup time before corruption occurred.
3. Stop the application server temporarily or put the tenant in maintenance mode.
4. Run point-in-time recovery (PITR) to a temporary database:
   ```bash
   pgbackrest --stanza=namasoft-prod --target-time="2026-05-08 14:00:00" --type=time restore
   ```
5. Extract the tenant's data and merge it back into production.
6. Verify accounting balances (`JournalEntry` totalDebit/Credit matches).

### Scenario 2: Full Database Loss or Server Crash
**Symptom:** Primary database server is dead and unrecoverable.
**Action:**
1. Provision a new Hetzner PostgreSQL instance.
2. Install `pgbackrest`.
3. Sync backups from the immutable S3 storage:
   ```bash
   aws s3 sync s3://namasoft-backups/latest /var/lib/pgbackrest
   ```
4. Restore the database:
   ```bash
   pgbackrest --stanza=namasoft-prod restore
   ```
5. Start PostgreSQL.
6. Verify journal balances using the automated sanity check scripts.
7. Update DNS/Connection Strings and notify users.

### Scenario 3: Ransomware / Total Compromise
**Symptom:** Server compromised, backups on the server deleted.
**Action:**
1. Isolate and shut down the affected systems immediately.
2. Provision an entirely fresh environment.
3. Restore from the offline S3 (immutable bucket) which prevents overwrite/deletion for 30 days.
4. Follow steps 4-7 from Scenario 2.
5. Rotate all database credentials and application secrets.

---

## Validation & Testing Schedule
- **Automated Checks:** Daily cron script checks for backup success status.
- **Manual DR Drill:** To be conducted bi-annually on a staging server.
