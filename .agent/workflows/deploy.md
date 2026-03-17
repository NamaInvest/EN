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

**App Login**: admin / O_O772040030

## Important Notes
- Local machine does NOT have `git`, `scp`, or `ssh` in PATH
- Must use full path: `C:\Windows\System32\OpenSSH\ssh.exe` and `C:\Windows\System32\OpenSSH\scp.exe`
- The app uses Next.js with Prisma, deployed via PM2
- **GitHub Repo**: `https://github.com/iceman18ice-sketch/namasoft9-3.git`

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
