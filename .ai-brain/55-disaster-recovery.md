# 55 - استعادة الكوارث والنسخ الاحتياطية (Disaster Recovery)

> Backup + Restore + Failover + Business Continuity

---

## 🎯 RPO & RTO Targets

| المعيار | الهدف |
|---|---|
| **RPO** (Recovery Point Objective) | ≤ 1 ساعة (max data loss) |
| **RTO** (Recovery Time Objective) | ≤ 4 ساعات (max downtime) |
| **Backup Frequency** | يومي full + hourly incremental |
| **Retention** | 30 يوم محلي + 1 سنة off-site |

---

## 💾 استراتيجية النسخ الاحتياطية

### الـ Levels:

#### 1. Database Backups:
```bash
# اليومي (cron 2 AM):
pg_dump $DATABASE_URL | gzip > /var/backups/namasoft/daily/{tenant}-$(date +%Y%m%d).sql.gz

# الأسبوعي:
# نفسه + رفع لـ S3/B2

# الشهري:
# نفسه + archive طويل المدى
```

#### 2. Files Backups:
- `/uploads/` — صور المنتجات، PDFs، attachments
- `/var/log/` — logs (retention 90 day)
- `/etc/namasoft/` — configurations
- `/.env` files — encrypted

#### 3. Application Code:
- Git repository (GitHub/GitLab)
- Multiple mirrors
- Tagged releases

### Backup Cron:
```typescript
// /api/cron/backup
async function dailyBackup() {
    const tenants = await getAllTenants();
    
    for (const tenant of tenants) {
        try {
            // 1. Database dump
            const dbUrl = getDbUrl(tenant.subdomain);
            const dumpFile = `/var/backups/namasoft/${tenant.subdomain}/$(date +%Y%m%d).sql.gz`;
            await execAsync(`pg_dump ${dbUrl} | gzip > ${dumpFile}`);
            
            // 2. Files
            const filesDir = `/uploads/${tenant.subdomain}/`;
            await execAsync(`tar -czf /var/backups/.../files-$(date).tar.gz ${filesDir}`);
            
            // 3. Hash & Sign
            const hash = sha256(dumpFile);
            await prisma.backupManifest.create({
                data: { tenantId, date, size, hash, location: dumpFile }
            });
            
            // 4. Upload to S3 (off-site)
            if (S3_BUCKET) {
                await uploadToS3(dumpFile, `backups/${tenant.subdomain}/`);
            }
            
            // 5. Verify
            const sizeBytes = (await fs.stat(dumpFile)).size;
            if (sizeBytes < 1000) {
                throw new Error('Backup too small, likely failed');
            }
            
        } catch (e) {
            // CRITICAL: notify admin immediately
            await sendTelegramAlert('Backup FAILED for ' + tenant.subdomain);
            await sendEmailAlert(...);
        }
    }
    
    // 6. Cleanup (older than 30 days)
    await execAsync(`find /var/backups/namasoft -mtime +30 -delete`);
}
```

---

## 🔄 سيناريوهات الاستعادة

### Scenario 1: Tenant واحد فقد بياناته
**السبب:** خطأ في deployment، delete by mistake, corruption

```bash
# 1. تحديد الـ tenant
TENANT="aljassim"

# 2. تحديد آخر backup سليم
ls -la /var/backups/namasoft/$TENANT/

# 3. إيقاف الـ service مؤقتاً
pm2 stop main-site

# 4. Drop & Recreate DB
psql -U postgres -c "DROP DATABASE ${TENANT}_db;"
psql -U postgres -c "CREATE DATABASE ${TENANT}_db;"

# 5. Restore
gunzip < /var/backups/namasoft/$TENANT/2026-05-13.sql.gz | psql ${TENANT}_db

# 6. Verify
psql ${TENANT}_db -c "SELECT COUNT(*) FROM users;"
psql ${TENANT}_db -c "SELECT MAX(created_at) FROM sales_invoice;"

# 7. Apply latest schema (إذا needed):
DATABASE_URL=... npx prisma@5.22.0 db push --accept-data-loss

# 8. Restart
pm2 restart main-site

# 9. Smoke test
curl https://${TENANT}.namainvist.com/api/health

# 10. Notify customer + document incident
```

### Scenario 2: السيرفر بالكامل تعطّل
**السبب:** Hardware failure, OS crash, DDoS

```
1. التواصل مع Hetzner Support
2. Spin up new server (نفس spec)
3. تثبيت OS + dependencies:
   - PostgreSQL
   - Node.js
   - PM2
   - Nginx
4. Restore application:
   git clone <repo>
   npm install
   npm run build
5. Restore database (لكل tenant):
   - من backups محلية (لو السيرفر القديم accessible)
   - أو من S3 (الـ off-site backup)
6. تحديث DNS (Cloudflare):
   - تغيير الـ IP لو لزم
7. Verify health checks
8. Notify customers
9. Post-mortem analysis
```

### Scenario 3: قاعدة بيانات Master معطوبة
**السبب:** Disk failure, RAID corruption

```
⚠️ CRITICAL — كل الـ tenants متأثرة

1. Mark website as "Under Maintenance"
   - في Cloudflare: enable maintenance page
   
2. Backup current state (إذا possible)

3. Drop & Recreate:
   DROP DATABASE n11_db;
   CREATE DATABASE n11_db;

4. Restore from last backup:
   gunzip < /var/backups/n11/latest.sql.gz | psql n11_db

5. Verify integrity:
   SELECT COUNT(*) FROM tenant_account;
   SELECT COUNT(*) FROM desktop_license;

6. Resume services

7. Inform customers (transparency)
```

### Scenario 4: Ransomware Attack
**Worst-case scenario**

```
1. Isolate infected systems:
   - Disconnect from network
   - Stop services
   
2. Forensics:
   - Don't pay ransom
   - Identify attack vector
   - Document everything for police
   
3. Restore from clean backup:
   - استخدم backup قبل الـ attack
   - تأكد أنه ليس infected
   - Off-site backups (S3) عادة آمنة
   
4. Rebuild infrastructure:
   - New server (fresh OS)
   - Updated security
   - Stronger passwords
   - 2FA everywhere
   - Network segmentation
   
5. Restore data
6. Resume operations
7. Legal:
   - بلاغ شرعي
   - SDAIA notification (PDPL)
   - Customer notification
   - Penetration testing مكثف
```

---

## 🏗 High Availability Setup (مقترح للمستقبل)

### Current State (Single Server):
- 1 server (Hetzner)
- 1 PostgreSQL
- 1 Redis (لو مفعّل)
- Single Point of Failure (SPOF)

### Target HA Architecture:

```
                    ┌─────────────┐
                    │  Cloudflare  │
                    │  Load Balance│
                    └──────┬──────┘
                           │
        ┌─────────────────┼─────────────────┐
        ▼                  ▼                  ▼
    ┌────────┐      ┌────────┐         ┌────────┐
    │ App 1  │      │ App 2  │         │ App 3  │
    │ (PM2)  │      │ (PM2)  │         │ (PM2)  │
    └───┬────┘      └───┬────┘         └───┬────┘
        │                │                  │
        └────────┬───────┴──────────────────┘
                 ▼
         ┌────────────────┐
         │  PgBouncer     │
         │  Pool Manager  │
         └────────┬───────┘
                  ▼
         ┌────────────────┐
         │  PG Primary    │ ──── Streaming Replication ──▶ PG Standby
         │  (Master)      │                                  (Slave)
         └────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │  Redis Cluster │
         └────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │  S3/B2 Backups │
         └────────────────┘
```

### Benefits:
- ✅ No SPOF
- ✅ Auto-failover
- ✅ Read replicas (تخفيف الـ load)
- ✅ Geographic distribution (Saudi + EU)
- ✅ 99.9% uptime SLA

### الـ Cost:
- شهري إضافي: ~5,000-10,000 SAR
- ROI: تجنب downtime + reputation

---

## 🚨 Incident Response Playbook

### الـ Severity Levels:

| Level | Description | Response Time |
|---|---|---|
| **SEV1** | كامل النظام down | 15 دقيقة |
| **SEV2** | ميزة حرجة معطّلة | 1 ساعة |
| **SEV3** | ميزة ثانوية معطّلة | 4 ساعات |
| **SEV4** | تأثير بسيط | 24 ساعة |

### الـ Workflow:

```
1. Detection:
   - Sentry alert
   - Uptime monitor
   - Customer report
   - AI Auditor

2. Triage:
   - Classify severity
   - Assign to on-call engineer
   - Open incident ticket

3. Investigation:
   - Logs review
   - Recent deploys
   - DB health
   - Network status

4. Mitigation:
   - Quick fix (workaround)
   - Or rollback
   - Or scale up resources

5. Resolution:
   - Root cause fix
   - Test in staging
   - Deploy to production

6. Communication:
   - Status page update
   - Customer email
   - Stakeholders update

7. Post-Mortem (Blameless):
   - Timeline
   - Root cause
   - What worked
   - What didn't
   - Action items
   - Prevention plan
```

---

## 📋 Pre-Disaster Checklist

### اليومي:
- [ ] Verify backups completed successfully
- [ ] Check disk space (> 30% free)
- [ ] Check Sentry for new errors
- [ ] Check PM2 status

### الأسبوعي:
- [ ] Test backup restoration (one tenant)
- [ ] Review error patterns
- [ ] Update documentation

### الشهري:
- [ ] DR drill (simulated failure)
- [ ] Security audit
- [ ] Patch dependencies
- [ ] Capacity review

### الربعي:
- [ ] Full DR rehearsal
- [ ] External pen-test
- [ ] Architecture review

### السنوي:
- [ ] Update DR plan
- [ ] BC plan update
- [ ] Insurance review
- [ ] Team training

---

## 🎯 Recovery Time Comparison

| Disaster | Without DR | With Our DR |
|---|---|---|
| Single tenant DB corruption | Hours-Days | 30 min |
| Server failure | Days | 4 hours |
| Ransomware | Weeks | 1 day |
| Datacenter failure | Days | 2 hours (with HA) |
| Region outage | Weeks | 4 hours (with multi-region) |

---

## 📞 Emergency Contacts

| الحالة | الاتصال |
|---|---|
| **Server down** | Hetzner: +49 9831 505-0 |
| **DNS issues** | Cloudflare Support |
| **ZATCA outage** | ZATCA Support |
| **Mass user issue** | الـ Owner مباشرة |
| **Security breach** | CISO + Legal |
| **Data leak** | SDAIA (PDPL) |

### Internal:
- **Owner:** ialqrashi62@gmail.com
- **CTO:** (داخلي)
- **DevOps on-call:** (rotating)
- **CFO:** للقرارات المالية

---

## 🔐 Secrets Management

### Backup of Secrets:
- 🔒 **JWT_SECRET** — مشفر في multiple locations
- 🔒 **Encryption Keys** — Hardware Security Module (HSM) ideally
- 🔒 **ZATCA Private Keys** — Vault مشفر
- 🔒 **Database Passwords** — Encrypted, multiple admins know
- 🔒 **OAuth Secrets** — In secure password manager

### Recovery:
- Multiple admins have access (no single person)
- Encrypted at rest + in transit
- Audit log لكل وصول
