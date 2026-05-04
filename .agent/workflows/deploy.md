---
description: Deploy changes to the production server (Hetzner VPS)
---

# All Server Credentials (Quick Reference)

| Server | IP | SSH Key | App Path | PM2 Name | Port | DB |
|---|---|---|---|---|---|---|
| Fleet Server (Production) | 46.4.188.170 | **Password:** `_ee4SWbxLVfH9b` | `/www/wwwroot/namainvist.com` | `main-site` | 3000 | postgres@localhost |

**App Login**: admin / O_O772040030

---

## ⚠️ Nama Invest Fleet — Port Map (CRITICAL — DO NOT CHANGE)

> This is the definitive port map for the Nama Invest SaaS fleet on server **46.4.188.170**.
> **NEVER reassign these ports or mix them up.**

| Node | Domain | App Path | PM2 Name | Port |
|---|---|---|---|---|
| **Main Site** | `namainvist.com` | `/www/wwwroot/namainvist.com` | `main-site` | **3000** |
| **N1** (Template) | `n1.namainvist.com` | `/www/wwwroot/n1.namainvist.com` | `n1-main` | **3001** |
| **N7** | `n7.namainvist.com` | `/www/wwwroot/n7.namainvist.com` | `n7` | **3007** |
| **N11** (SaaS App) | `n11.namainvist.com` | `/www/wwwroot/n11.namainvist.com` | `saas-app` / `saas-dev` | **3011** / 3500 |
| **Custom Tenants** | `*.namainvist.com` | `/www/wwwroot/*.namainvist.com` | subdomain | **3013+** |

**Notes:**
- The **Main Site** (`namainvist.com` on port 3000) contains: Landing page + ICE Panel (`/ice`) + Onboarding
- **N1** (port 3001) is the master template used for cloning new tenants — it is NOT the main landing site
- **ICE Panel Owner Email:** `ialqrashi62@gmail.com`
- **Nginx** for `namainvist.com` proxies to `localhost:3000`
- **Nginx** for `n1.namainvist.com` proxies to `localhost:3001`

**SSH to Fleet Server:**
```powershell
C:\Windows\System32\OpenSSH\ssh.exe -o StrictHostKeyChecking=no root@46.4.188.170
# Password: _ee4SWbxLVfH9b
```

---

# Fleet Server Main Deploy Process (46.4.188.170)

Use `deploy_sync.js` or `deploy_today.js` to automatically sync files safely.

## ⚠️ Critical: Multi-Tenant Database Schema Updates (FATAL CLIENT-SIDE EXCEPTION Fix)

Because this is a **SaaS Multi-Tenant application**, each subdomain uses a completely separate PostgreSQL database. 
If you modify `prisma/schema.prisma` (e.g., adding `bookId` to a table), you **MUST** push the schema to **EVERY** tenant database individually. If you only push it to `namadb`, the `N11` tenant will crash with `PrismaClientValidationError` and `FATAL CLIENT-SIDE EXCEPTION` during server components render.

### 🚫 FATAL MISTAKE: Duplicate `schema.prisma` in Root
**NEVER** place a `schema.prisma` file directly in the root directory (e.g., `/www/wwwroot/n11.namainvist.com/schema.prisma`). 
Prisma prioritizes the root directory over the `prisma/` folder. If an outdated schema exists in the root, `npx prisma generate` and `db push` will silently use the outdated one, ignoring your real updates. This guarantees a `FATAL CLIENT-SIDE EXCEPTION`. Always ensure the only schema file is inside `prisma/schema.prisma`.

### 🚫 FATAL MISTAKE 2: The Hidden PostgreSQL Port (5433 vs 5432)
The Hetzner VPS runs **TWO** PostgreSQL clusters simultaneously:
- **Port 5432:** The REAL production database used by the application (`saas-app`, `main-site`, etc.).
- **Port 5433:** A phantom/secondary instance (often the default for `sudo -u postgres psql`).
If you run `sudo -u postgres psql` without specifying a port, it will connect to **5433**. If you fix permissions there, the actual app (on 5432) will still crash!
**Rule:** ALWAYS explicitly specify `-h localhost -p 5432` when running `psql` commands.

### The Correct Way to Push Multi-Tenant Schema & Fix Permissions

When deploying a schema change across the fleet, you must use the `postgres` superuser. However, because `postgres` creates the new tables, the tenant user (e.g. `n11_db`) will NOT have permission to read them (causing `permission denied for table FixedAsset`).
You MUST run a script to `db push` AND then `GRANT ALL PRIVILEGES` on port `5432`.

Example manual process for `n11.namainvist.com` (`saas-app`):
```bash
# 1. Push Schema using Postgres Superuser
cd /www/wwwroot/n11.namainvist.com
DATABASE_URL="postgresql://postgres@localhost:5432/n11_db?schema=public" npx prisma db push --accept-data-loss
npx prisma generate

# 2. Grant Permissions to the Application User (n11_db) on Port 5432
sudo -u postgres psql -h localhost -p 5432 -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO n11_db;" n11_db
sudo -u postgres psql -h localhost -p 5432 -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO n11_db;" n11_db

# 3. Rebuild and Restart
rm -rf .next && npm run build
pm2 restart saas-app
```

*(Note: You can use the local scripts `sync_all_tenants.js` followed by `fix_perms_5432.js` to automate this exact sequence across ALL existing tenant databases.)*

# Deploy to Fleet Server (46.4.188.170) — Main Site or N1

// turbo-all

Since the fleet server uses password auth, use Node.js ssh2 scripts:

**Deploy to Main Site (namainvist.com — port 3000):**
```powershell
node deploy_main_site.js
```

**Deploy to N1 (n1.namainvist.com — port 3001):**
```powershell
node deploy_ice_panel.js
```

**Important Notes:**
- Local machine does NOT have `git`, `scp`, or `ssh` in PATH
- Must use full path: `C:\Windows\System32\OpenSSH\ssh.exe` and `C:\Windows\System32\OpenSSH\scp.exe`
- The app uses Next.js with Prisma, deployed via PM2
- **GitHub Repo**: `https://github.com/iceman18ice-sketch/namasoft9-3.git`
- For fleet deploys always use Node.js ssh2 scripts (not OpenSSH) since fleet server uses password auth

---

# Desktop App Version Release Workflow (Nama Invest)

When preparing and releasing a new version for the Desktop Electron app, you must strictly follow these rules to avoid breaking the server or the desktop app:

1. **Version Update:**
   - Always increment the version number in `package.json` before building the desktop app.
   - The web server dynamically reads `package.json` to inform the desktop app of the latest version (via `/api/version/route.ts`).

2. **Next.js Output Configuration (`next.config.ts`):**
   - **CRITICAL:** Do NOT set `output: 'standalone'` globally in `next.config.ts`. If you do, `PM2` (which uses `next start` on the SaaS servers) will enter an infinite restart loop and throw `ReferenceError: request is not defined`.
   - Instead, use a conditional build flag: 
     ```typescript
     if (process.env.ELECTRON_BUILD) {
       nextConfig.output = 'standalone';
     }
     ```
   - Build the Electron app using `set ELECTRON_BUILD=1 && npm run build`.

3. **Uploading the Installer:**
   - After compiling the `.exe` installer (usually ~900MB), always upload it using `upload.ps1` or `upload-installer.js`.
   - Ensure the path is exactly `/www/wwwroot/namainvist.com/public/updates/desktop/NamaInvest-Setup-{version}.exe` to match the dynamic `/api/version` URL.

4. **Web Server Synchronization:**
   - After changing `package.json`, you must upload the new `package.json`, `src/app/page.tsx`, and `src/app/api/version/route.ts` to both `namainvist.com` and `n11.namainvist.com`.
   - Run `node update-web-version.js` to automatically push these files, clear `.next`, and rebuild `pm2`.

5. **Clerk Middleware Rules (`src/middleware.ts`):**
   - Any API routes that the desktop app needs to access without user authentication (like `/api/sys/desktop-crash` and `/api/version`) **MUST** be explicitly declared in `isPublicRoute` in `middleware.ts`.
   - If missing, Clerk will intercept the desktop's JSON requests and return an HTML login page (throwing HTTP ERROR 405 or 404 in the desktop app).