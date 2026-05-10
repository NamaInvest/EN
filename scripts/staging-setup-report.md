# Staging Setup Report
Generated: 2026-05-10T21:21:34.663Z

## What Was Done

### 1. Database
- Created PostgreSQL user `staging_user` with password `StagingPass2025`
- Created `staging_db` database (isolated from n11_db)
- Copied schema from `n11_db` (structure only, no customer data)
- Ran Prisma `db push` to ensure schema is up to date

### 2. PM2 Configuration
- Renamed process: `saas-dev` → `staging`
- Changed DB: `n11_db` → `staging_db` (isolated!)
- Updated URL: `dev.namainvist.com` → `staging.namainvist.com`

### 3. Nginx
- Created: `/www/server/panel/vhost/nginx/staging.namainvist.com.conf`
- Added Basic Auth protection (user: nama / pass: nama2025)
- Reloaded Nginx

### 4. Security
- Staging is protected with HTTP Basic Auth
- Cannot be accessed by the public without credentials

## Subdomains Summary

| Subdomain | Port | Process | Database | Purpose |
|-----------|------|---------|----------|---------|
| namainvist.com | 3000 | main-site | n11_db | Production main |
| n1.namainvist.com | 3001 | n1-main | n1_db | Tenant #1 |
| n11.namainvist.com | 3500 | saas-app | n11_db | Tenant #11 |
| staging.namainvist.com | 3600 | staging | staging_db | Testing (isolated) |

## ⚠️ DNS Note
Make sure to add an A record for `staging.namainvist.com` → `46.4.188.170` in your DNS provider.
The wildcard `*.namainvist.com` may already cover this.

## Staging Credentials
- URL: https://staging.namainvist.com
- Basic Auth User: nama
- Basic Auth Pass: nama2025
