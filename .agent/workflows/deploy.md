---
description: Deploy changes to the production server (Hetzner VPS)
---

# All Server Credentials (Quick Reference)

| Server | IP | SSH Key | App Path | PM2 Name | Port | DB |
|---|---|---|---|---|---|---|
| Server 1 | 95.217.187.44 | `C:\Users\1\.ssh\hetzner_key` | `/var/www/namasoft` | `namasoft` | 80 | `postgresql://namasoft:Nama2024secure@localhost:5432/namadb` |
| Server 2a | 204.168.144.74 | `C:\Users\1\Desktop\namasoftkey\namasoft_key` | `/var/www/namasoft` | `namasoft` | 80 | `postgresql://namasoft:Nama2024secure@localhost:5432/namadb` |
| Server 2b | 204.168.144.74 | `C:\Users\1\Desktop\namasoftkey\namasoft_key` | `/var/www/namasoft2` | `namasoft2` | 3001 | `postgresql://namasoft:Nama2024secure@localhost:5432/namadb` |
| Server 3 | 185.197.195.202 | `C:\Users\1\.ssh\id_ed25519_deploy` | `/var/www/namasoft` | `namasoft` | 80 | `postgresql://namasoft:Nama2024secure@localhost:5432/namadb` |
| Fleet Server | 46.4.188.170 | **Password:** `_ee4SWbxLVfH9b` | (see fleet map below) | (see below) | (see below) | postgres@localhost |

**App Login**: admin / O_O772040030

---

## ⚠️ Nama Invest Fleet — Port Map (CRITICAL — DO NOT CHANGE)

> This is the definitive port map for the Nama Invest SaaS fleet on server **46.4.188.170**.
> **NEVER reassign these ports or mix them up.**

| Node | Domain | App Path | PM2 Name | Port |
|---|---|---|---|---|
| **Main Site** | `namainvist.com` | `/www/wwwroot/namainvist.com` | `main-site` | **3000** |
| **N1** | `n1.namainvist.com` | `/www/wwwroot/n1.namainvist.com` | `n1-main` | **3001** |
| **N2** | `n2.namainvist.com` | `/www/wwwroot/n2.namainvist.com` | `n2` | **3002** |
| **N3** | `n3.namainvist.com` | `/www/wwwroot/n3.namainvist.com` | `n3` | **3003** |
| **N4** | `n4.namainvist.com` | `/www/wwwroot/n4.namainvist.com` | `n4` | **3004** |
| **N5** | `n5.namainvist.com` | `/www/wwwroot/n5.namainvist.com` | `n5` | **3005** |
| **N6** | `n6.namainvist.com` | `/www/wwwroot/n6.namainvist.com` | `n6` | **3006** |
| **N7** | `n7.namainvist.com` | `/www/wwwroot/n7.namainvist.com` | `n7` | **3007** |
| **N8** | `n8.namainvist.com` | `/www/wwwroot/n8.namainvist.com` | `n8` | **3008** |
| **N9** | `n9.namainvist.com` | `/www/wwwroot/n9.namainvist.com` | `n9` | **3009** |
| **N10** | `n10.namainvist.com` | `/www/wwwroot/n10.namainvist.com` | `n10` | **3010** |
| **N11** | `n11.namainvist.com` | `/www/wwwroot/n11.namainvist.com` | `n11` | **3011** |
| **New tenants** | `*.namainvist.com` | `/www/wwwroot/*.namainvist.com` | subdomain | **3013+** |

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

# Deploy to Server 1 (95.217.187.44)

// turbo-all

1. Upload changed files:
```powershell
C:\Windows\System32\OpenSSH\scp.exe -i C:\Users\1\.ssh\hetzner_key "<LOCAL_PATH>" "root@95.217.187.44:<REMOTE_PATH>"
```

2. Build and restart:
```powershell
C:\Windows\System32\OpenSSH\ssh.exe -i C:\Users\1\.ssh\hetzner_key root@95.217.187.44 "cd /var/www/namasoft && npm run build && pm2 restart namasoft"
```

---
# Deploy to Server 2 (204.168.144.74 — both instances)

// turbo-all

1. Upload changed files to namasoft:
```powershell
C:\Windows\System32\OpenSSH\scp.exe -i "C:\Users\1\Desktop\namasoftkey\namasoft_key" "<LOCAL_PATH>" "root@204.168.144.74:/var/www/namasoft/<REMOTE_PATH>"
```

2. Copy files to namasoft2:
```powershell
C:\Windows\System32\OpenSSH\ssh.exe -i "C:\Users\1\Desktop\namasoftkey\namasoft_key" root@204.168.144.74 "cp <FILE> /var/www/namasoft2/<SAME_PATH>"
```

3. Build and restart both:
```powershell
C:\Windows\System32\OpenSSH\ssh.exe -i "C:\Users\1\Desktop\namasoftkey\namasoft_key" root@204.168.144.74 "cd /var/www/namasoft && npm run build && pm2 restart namasoft && cd /var/www/namasoft2 && npm run build && pm2 restart namasoft2"
```

---


# Deploy to Server 3 (185.197.195.202)

// turbo-all

1. Upload changed files:
```powershell
C:\Windows\System32\OpenSSH\scp.exe -i C:\Users\1\.ssh\id_ed25519_deploy -o StrictHostKeyChecking=no "<LOCAL_PATH>" "root@185.197.195.202:<REMOTE_PATH>"
```

2. Build and restart:
```powershell
C:\Windows\System32\OpenSSH\ssh.exe -i C:\Users\1\.ssh\id_ed25519_deploy -o StrictHostKeyChecking=no root@185.197.195.202 "cd /var/www/namasoft && npm run build && pm2 restart namasoft"
```

---

# Running Remote Commands

Server 1:
```powershell
C:\Windows\System32\OpenSSH\ssh.exe -i C:\Users\1\.ssh\hetzner_key root@95.217.187.44 "<COMMAND>"
```

Server 2:
```powershell
C:\Windows\System32\OpenSSH\ssh.exe -i "C:\Users\1\Desktop\namasoftkey\namasoft_key" root@204.168.144.74 "<COMMAND>"
```

Server 3:
```powershell
C:\Windows\System32\OpenSSH\ssh.exe -i C:\Users\1\.ssh\id_ed25519_deploy -o StrictHostKeyChecking=no root@185.197.195.202 "<COMMAND>"
```

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