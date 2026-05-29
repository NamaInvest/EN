---
description: Deploy changes to the production server (Hetzner VPS)
---

# All Server Credentials (Quick Reference)

| Server | IP | SSH Key | App Path | PM2 Config | Port Range | DB |
|---|---|---|---|---|---|---|
| Fleet Server (Production) | 46.4.188.170 | **Password:** `process.env.SSH_PASSWORD` | `/www/wwwroot/namainvist.com` | `ecosystem.config.js` | 3000-3600 | postgres@localhost |

**App Login**: admin / O_O772040030

---

## 🏗️ Architecture: Unified Multi-Tenant (Single Codebase)

> **All PM2 apps run from ONE directory:** `/www/wwwroot/namainvist.com`
> One build = all tenants updated. Deploy in **2 minutes** instead of 12.

```
/www/wwwroot/namainvist.com/          ← الكود الموحّد
├── ecosystem.config.js               ← PM2 config (4 apps, same cwd)
├── .env                              ← main-site env (Clerk + master DB)
├── .next/                            ← بناء واحد مشترك
└── src/proxy.ts                      ← Middleware يحدد الـ tenant من subdomain
```

### Port Map

| Node | Domain | PM2 Name | Port | Database |
|---|---|---|---|---|
| **Main Site** | `namainvist.com` | `main-site` | **3000** | n11_db (master) |
| **N1** (Tenant) | `n1.namainvist.com` | `n1-main` | **3001** | n1_db |
| **N11** (SaaS App) | `n11.namainvist.com` | `saas-app` | **3500** | n11_db |
| **Dev** | `dev.namainvist.com` | `saas-dev` | **3600** | n11_db |

**Notes:**
- **Main Site** (`namainvist.com` port 3000): Landing page + Clerk SSO + ICE Panel (`/ice`) + Onboarding
- **N1** (port 3001): Tenant instance with separate DB (`n1_db`)
- **ICE Panel Owner Email:** `ialqrashi62@gmail.com`
- **Nginx** for each domain proxies to the corresponding `localhost:PORT`

**SSH to Fleet Server:**
```powershell
C:\Windows\System32\OpenSSH\ssh.exe -o StrictHostKeyChecking=no root@46.4.188.170
# Password: process.env.SSH_PASSWORD
```

---

# 🚀 Deploy Commands (Smart Deploy Script)

// turbo-all

## Quick Reference

```powershell
# API-only changes (ثواني — بدون build)
node deploy.js --files-only src/app/api/sales/route.ts src/lib/decimal-utils.ts

# Config/UI changes (دقيقتين — build واحد)
node deploy.js --build next.config.ts

# Full build deploy (دقيقتين)
node deploy.js --build

# Restart only (ثانية واحدة)
node deploy.js --restart-only
```

## Deploy Rules

| نوع التغيير | الأمر | الوقت |
|---|---|---|
| ملف API (`src/app/api/...`) | `--files-only` | **5 ثواني** |
| ملف lib/utils (`src/lib/...`) | `--files-only` | **5 ثواني** |
| ملف ترجمة (`src/locales/...`) | `--files-only` | **5 ثواني** |
| ملف config (`next.config.ts`) | `--build` | **~2 دقيقة** |
| ملف UI (`page.tsx`, `layout.tsx`) | `--build` | **~2 دقيقة** |
| ملف component | `--build` | **~2 دقيقة** |
| `package.json` / dependencies | `--build` (+ npm install on server) | **~3 دقائق** |

### ⚠️ CRITICAL RULES

1. **NEVER delete `.next` before building!** Build overwrites it safely.
2. **One build = all tenants updated** — no need to copy files to multiple folders.
3. **API changes DON'T need build** — just upload and restart.

---

# Multi-Tenant Database Schema Updates

Because this is a **SaaS Multi-Tenant application**, each subdomain uses a completely separate PostgreSQL database. 
If you modify `prisma/schema.prisma`, you **MUST** push the schema to **EVERY** tenant database individually.

### 🚫 FATAL MISTAKE: Duplicate `schema.prisma` in Root
**NEVER** place a `schema.prisma` file directly in the root directory.
Prisma prioritizes the root directory over the `prisma/` folder. Always ensure the only schema file is inside `prisma/schema.prisma`.

### 🚫 FATAL MISTAKE 2: The Hidden PostgreSQL Port (5433 vs 5432)
The Hetzner VPS runs **TWO** PostgreSQL clusters simultaneously:
- **Port 5432:** The REAL production database used by the application.
- **Port 5433:** A phantom/secondary instance (default for `sudo -u postgres psql`).
**Rule:** ALWAYS explicitly specify `-h localhost -p 5432` when running `psql` commands.

### The Correct Way to Push Multi-Tenant Schema & Fix Permissions

```bash
# 1. Push Schema using Postgres Superuser (from the unified codebase directory)
cd /www/wwwroot/namainvist.com
DATABASE_URL="postgresql://postgres@localhost:5432/n11_db?schema=public" npx prisma db push --accept-data-loss
DATABASE_URL="postgresql://postgres@localhost:5432/n1_db?schema=public" npx prisma db push --accept-data-loss
npx prisma generate

# 2. Grant Permissions to Application Users on Port 5432
sudo -u postgres psql -h localhost -p 5432 -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO n11_db;" n11_db
sudo -u postgres psql -h localhost -p 5432 -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO n11_db;" n11_db
sudo -u postgres psql -h localhost -p 5432 -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO n1_db;" n1_db
sudo -u postgres psql -h localhost -p 5432 -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO n1_db;" n1_db

# 3. Rebuild and Restart (ONE build for all)
npm run build
pm2 restart all
```

---

# Desktop App Version Release Workflow (Nama Invest)

1. **Version Update:**
   - Always increment the version number in `package.json` before building the desktop app.
   - The web server dynamically reads `package.json` to inform the desktop app of the latest version (via `/api/version/route.ts`).

2. **Next.js Output Configuration (`next.config.ts`):**
   - **CRITICAL:** Do NOT set `output: 'standalone'` globally in `next.config.ts`. If you do, `PM2` will enter an infinite restart loop.
   - Instead, use a conditional build flag: 
     ```typescript
     if (process.env.ELECTRON_BUILD) {
       nextConfig.output = 'standalone';
     }
     ```
   - Build the Electron app using `set ELECTRON_BUILD=1 && npm run build`.

3. **Uploading the Installer:**
   - After compiling the `.exe` installer (~900MB), upload using `upload.ps1` or `upload-installer.js`.
   - Ensure path is exactly `/www/wwwroot/namainvist.com/public/updates/desktop/NamaInvest-Setup-{version}.exe`.

4. **Web Server Synchronization:**
   - After changing `package.json`, upload and rebuild: `node deploy.js --build package.json`
   - Since all apps share one codebase, no need to sync multiple directories.

5. **Clerk Middleware Rules (`middleware.ts`):**
   - Any API routes that the desktop app needs to access without authentication **MUST** be declared in `isPublicRoute` in `middleware.ts`.
   - If missing, Clerk will intercept desktop's JSON requests and return HTML login page.

---

# Adding a New Tenant

With the unified architecture, adding a new tenant is simple:

```bash
# 1. Create database
sudo -u postgres psql -h localhost -p 5432 -c "CREATE USER newclient_db WITH PASSWORD 'newclient_pass123';"
sudo -u postgres psql -h localhost -p 5432 -c "CREATE DATABASE newclient_db OWNER newclient_db;"

# 2. Push schema
cd /www/wwwroot/namainvist.com
DATABASE_URL="postgresql://postgres@localhost:5432/newclient_db?schema=public" npx prisma db push
sudo -u postgres psql -h localhost -p 5432 -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO newclient_db;" newclient_db

# 3. Add to ecosystem.config.js
# Add a new app entry with the correct PORT and DATABASE_URL

# 4. Restart PM2
pm2 restart ecosystem.config.js --update-env && pm2 save

# 5. Configure Nginx
# Add reverse proxy for newclient.namainvist.com → localhost:NEW_PORT
```

No code copying needed! ✅