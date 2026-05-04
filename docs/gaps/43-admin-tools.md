# النقص #43: Admin Tools (Backups + SIEM + Health + Crashes) — مواصفات

> **المرجعيات:** AWS Systems Manager、Azure Monitor、Datadog、Splunk、PagerDuty、Sentry、New Relic

---

## 1. البرومنت

```
وسّع Admin Tools:

موجود: /admin/backups, /admin/crashes, /admin/saas, /admin/siem, /sys/health, /sys/alerts

النواقص:
A) Backup management (full + incremental)
B) Disaster Recovery (RTO/RPO)
C) System health monitoring
D) Crash log analysis
E) SIEM (Security Information & Event Management)
F) Performance monitoring (APM)
G) Capacity planning
H) Database admin tools
I) Cron job management
J) Cache management
K) Queue monitoring (BullMQ)
L) System maintenance windows

APIs (35+), UI (15 pages), Tests 50+
```

---

## 2. السيناريوهات (8)

### A — Backup Schedule
```
- Daily: 2 AM, full backup → S3
- Hourly: incremental
- Retention: 30 days hot + 7 years cold
- Weekly: integrity verification
- Monthly: restoration test
```

### B — Disaster Recovery
```
- Primary region down
- Failover to DR region (15 min RTO)
- Latest backup restored
- Service continues
- Once primary up: sync delta + switch back
```

### C — Health Monitoring
```
- Real-time:
  - CPU/Memory per server
  - DB connection pool
  - API response times
  - Queue lengths
  - Error rates
- Thresholds → alerts
- Auto-scaling triggers
```

### D — Crash Investigation
```
- Error captured by Sentry
- Grouped by stack trace
- Frequency tracked
- Affected users counted
- Notification to dev team
- Triage + fix
- Resolved
```

### E — Security Event
```
- SIEM detects: 50 failed logins from one IP
- Auto-block IP
- Alert security team
- Investigate
- Update firewall rules
```

### F — Maintenance Window
```
- Scheduled: Sunday 2-4 AM
- Notification 7d ahead
- During window: maintenance mode (read-only)
- Tasks: DB upgrade, deploy, cleanup
- Post-window: smoke tests
```

### G — Capacity Planning
```
- Trends: 30% growth in transactions
- Projections: server limits in 4 months
- Recommendations: scale up DB, add cache nodes
- Budget for next quarter
```

### H — Cron Job Health
```
- Daily reports: which jobs ran, success/fail
- Alert on consecutive failures (3+)
- Manual trigger if needed
- Audit cron schedule
```

---

## 3. تدفق البيانات

```
[Backup]
Cron daily 2 AM:
   ↓ trigger backup script
   ↓ dump DB → upload to S3
   ↓ verify integrity
   ↓ rotate old backups
   ↓ alert on failure

[Health Check]
Every 30s:
   ↓ collect metrics
   ↓ check thresholds
   ↓ trigger alerts if breached
   ↓ store in time-series DB

[SIEM]
Event-driven:
   ↓ analyze logs
   ↓ pattern matching
   ↓ score severity
   ↓ correlate events
```

---

## 4. Schema

```prisma
model SystemBackup {
  id              Int       @id @default(autoincrement())
  backupNumber    String    @unique
  type            String    // 'FULL' | 'INCREMENTAL' | 'DIFFERENTIAL'
  
  scope           String    // 'ALL_TENANTS' | 'SPECIFIC_TENANT' | 'SYSTEM_DB'
  tenantId        Int?
  
  startedAt       DateTime
  completedAt     DateTime?
  durationSeconds Int?
  
  sizeBytes       BigInt?
  s3Path          String?
  encryptionKeyId String?
  
  integrityHash   String?
  integrityVerifiedAt DateTime?
  
  status          String    @default("RUNNING")  // RUNNING | SUCCESS | FAILED | VERIFYING | CORRUPTED
  
  retentionUntil  DateTime
  
  errorMessage    String?
}

model BackupRestore {
  id              Int       @id @default(autoincrement())
  backupId        Int
  
  initiatedAt     DateTime  @default(now())
  initiatedByUserId String
  reason          String    @db.Text
  
  targetEnvironment String  // 'PRODUCTION' | 'STAGING' | 'DR'
  
  status          String    // 'INITIATED' | 'RESTORING' | 'VERIFYING' | 'COMPLETED' | 'FAILED'
  completedAt     DateTime?
  
  approvedByUserId String
  approvedAt      DateTime
}

model SystemHealthMetric {
  id              BigInt    @id @default(autoincrement())
  
  metricType      String    // 'CPU' | 'MEMORY' | 'DISK' | 'API_RESPONSE_TIME' | 'DB_QUERIES' | 'QUEUE_LENGTH' | 'ERROR_RATE'
  serverId        String?
  
  value           Decimal   @db.Decimal(20,4)
  unit            String?
  
  recordedAt      DateTime  @default(now())
  
  @@index([metricType, recordedAt])
}

model SystemAlert {
  id              Int       @id @default(autoincrement())
  alertType       String
  severity        String    // 'INFO' | 'WARNING' | 'CRITICAL' | 'EMERGENCY'
  
  source          String    // 'HEALTH_CHECK' | 'SIEM' | 'CRASH' | 'CRON' | 'BACKUP' | 'CUSTOM'
  
  title           String
  description     String    @db.Text
  
  metadata        Json?
  
  status          String    @default("OPEN")  // OPEN | ACKNOWLEDGED | RESOLVED | DISMISSED
  
  acknowledgedAt  DateTime?
  acknowledgedByUserId String?
  resolvedAt      DateTime?
  resolvedByUserId String?
  resolutionNotes String?
  
  triggeredAt     DateTime  @default(now())
  
  notificationSent Json?    // {channels: [...], status: ...}
}

model CrashReport {
  id              Int       @id @default(autoincrement())
  fingerprint     String    // grouping by stack trace
  
  errorType       String
  errorMessage    String    @db.Text
  stackTrace      String    @db.Text
  
  affectedUsers   Int       @default(0)
  occurrenceCount Int       @default(1)
  
  firstSeenAt     DateTime
  lastSeenAt      DateTime
  
  environment     String
  release         String?
  browser         String?
  os              String?
  
  status          String    @default("UNRESOLVED")  // UNRESOLVED | INVESTIGATING | RESOLVED | IGNORED
  
  assignedToUserId String?
  resolvedAt      DateTime?
  resolutionNotes String?
  
  @@index([fingerprint])
  @@index([status, lastSeenAt])
}

model SiemEvent {
  id              BigInt    @id @default(autoincrement())
  eventType       String    // 'LOGIN_FAILED' | 'BRUTE_FORCE' | 'SQL_INJECTION' | 'XSS_ATTEMPT' | 'UNAUTHORIZED_ACCESS' | 'DATA_EXFIL'
  severity        String
  
  sourceIp        String?
  userAgent       String?
  userId          String?
  
  details         Json
  
  blocked         Boolean   @default(false)
  alertSentAt     DateTime?
  
  occurredAt      DateTime  @default(now())
  
  @@index([eventType, occurredAt])
  @@index([sourceIp, occurredAt])
}

model BlockedIp {
  id              Int       @id @default(autoincrement())
  ipAddress       String    @unique
  reason          String
  
  blockedAt       DateTime  @default(now())
  blockedUntil    DateTime?
  
  blockedByUserId String?
  manuallyBlocked Boolean   @default(false)
  
  unblockReason   String?
  unblockedAt     DateTime?
}

model CronJob {
  id              Int       @id @default(autoincrement())
  jobCode         String    @unique
  name            String
  
  cronExpression  String
  module          String
  function        String
  
  active          Boolean   @default(true)
  
  lastRunAt       DateTime?
  lastRunStatus   String?
  lastRunDuration Int?
  
  nextRunAt       DateTime?
  
  consecutiveFailures Int   @default(0)
  totalRuns       BigInt    @default(0)
  totalFailures   BigInt    @default(0)
}

model CronExecution {
  id              BigInt    @id @default(autoincrement())
  jobId           Int
  
  startedAt       DateTime  @default(now())
  completedAt     DateTime?
  durationMs      Int?
  
  status          String    // 'RUNNING' | 'SUCCESS' | 'FAILED' | 'TIMEOUT'
  
  output          String?   @db.Text
  errorMessage    String?
  errorStackTrace String?   @db.Text
  
  triggeredBy     String    // 'SCHEDULE' | 'MANUAL' | 'API'
  triggeredByUserId String?
  
  @@index([jobId, startedAt])
}

model MaintenanceWindow {
  id              Int       @id @default(autoincrement())
  title           String
  description     String?
  
  startTime       DateTime
  endTime         DateTime
  
  type            String    // 'EMERGENCY' | 'PLANNED' | 'ROUTINE'
  affectedServices String[]
  
  notificationSent Boolean  @default(false)
  
  status          String    @default("SCHEDULED")  // SCHEDULED | ACTIVE | COMPLETED | CANCELLED
  
  createdByUserId String
  approvedByUserId String?
}

model QueueJob {
  id              BigInt    @id @default(autoincrement())
  queueName       String
  jobType         String
  
  payload         Json
  
  status          String    // 'WAITING' | 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'DELAYED'
  attempts        Int       @default(0)
  maxAttempts     Int       @default(3)
  
  startedAt       DateTime?
  completedAt     DateTime?
  failedAt        DateTime?
  
  errorMessage    String?
  
  createdAt       DateTime  @default(now())
  
  @@index([queueName, status])
}

model DatabaseStat {
  id              Int       @id @default(autoincrement())
  recordedAt      DateTime  @default(now())
  
  totalSize       BigInt
  largestTable    String?
  largestTableSize BigInt?
  
  activeConnections Int
  slowQueriesCount Int
  
  topQueries      Json?
}
```

---

## 5. Forms (8)

A: Backup Schedule Setup
B: Restore Request
C: Maintenance Window Schedule
D: Cron Job Configuration
E: Alert Rule Setup
F: IP Block / Unblock
G: System Notification Recipients
H: Capacity Forecast Setup

---

## 6. Tables (8)

A: Backup History
B: System Health (live)
C: Active Alerts
D: Crash Reports (grouped)
E: SIEM Events
F: Blocked IPs
G: Cron Jobs Status
H: Queue Jobs

---

## 7. Buttons (28+)

| Button | Color | Permission |
|--------|-------|------------|
| btn-backup-now | + نسخة احتياطية الآن | 🟢 super admin |
| btn-backup-verify | تحقق من سلامة | 🟦 super admin |
| btn-backup-restore | استعادة | 🔴 super admin + approval |
| btn-backup-rotate | تدوير | ⬜ admin |
| btn-dr-failover | تحويل لـ DR | 🔴 super admin + cfo |
| btn-dr-failback | الرجوع | 🔴 super admin |
| btn-health-check-run | فحص فوري | 🟦 admin |
| btn-alert-acknowledge | تأكيد | 🟢 admin |
| btn-alert-resolve | حل | 🟢 admin |
| btn-alert-dismiss | تجاهل | 🔴 admin + reason |
| btn-crash-assign | إسناد | 🟦 dev mgr |
| btn-crash-resolve | حل | 🟢 dev |
| btn-crash-ignore | تجاهل | 🟡 dev mgr |
| btn-siem-investigate | تحقيق | 🟡 security |
| btn-siem-create-rule | + قاعدة | 🟢 security |
| btn-ip-block | حظر IP | 🔴 admin + reason |
| btn-ip-unblock | فك الحظر | 🟢 admin |
| btn-maintenance-schedule | + نافذة صيانة | 🟢 admin |
| btn-maintenance-cancel | إلغاء | 🔴 admin + reason |
| btn-maintenance-extend | تمديد | 🟡 admin |
| btn-cron-trigger | تشغيل cron يدوياً | 🟦 admin |
| btn-cron-pause | إيقاف cron | 🟡 admin |
| btn-cron-edit-schedule | تعديل الجدولة | 🟦 super admin |
| btn-queue-retry-failed | إعادة الفاشل | 🟦 admin |
| btn-queue-purge | إفراغ الـ queue | 🔴 super admin |
| btn-cache-clear | مسح الـ cache | 🔴 super admin |
| btn-db-vacuum | تنظيف DB | 🔴 super admin + window |
| btn-db-analyze | تحليل DB | ⬜ super admin |
| btn-export-logs | تصدير logs | ⬜ admin |

---

## 8. Search & Filters

- Backups: type, date, status
- Alerts: severity, status, source
- Crashes: status, fingerprint, environment
- SIEM: event type, IP, severity
- Cron: status, last run
- Queue: name, status

---

## 9. Reports

- Backup Compliance
- System Uptime
- Alert Frequency
- Crash Trend
- Security Incidents
- Cron Job Reliability
- Capacity Forecast
- Database Performance

---

## 10. Dashboards

- KPIs: Uptime / Backup Status / Active Alerts / Crash Rate / Queue Length
- Charts: Response time trend, Error rate, CPU/Memory
- Lists: Active alerts, Recent crashes, Failed cron jobs

---

## 11. Notifications

- Backup failed
- Health metric breached
- Crash spike
- SIEM critical event
- Cron job failed (3 in row)
- Disk space low
- Maintenance window starting
- Queue backed up

---

## 12. Permissions

| Action | Admin | Super Admin |
|--------|-------|-------------|
| View backups | ✓ | ✓ |
| Restore | ✗ | ✓ + approval |
| Failover DR | ✗ | ✓ + CEO |
| Block IP | ✓ | ✓ |
| Resolve alerts | ✓ | ✓ |
| Trigger cron | ✓ | ✓ |
| Edit cron schedule | ✗ | ✓ |
| Maintenance | ✓ | ✓ |
| Cache clear | ✗ | ✓ |
| DB operations | ✗ | ✓ |

---

## 13. Integrations

- AWS S3 / Azure Blob (backups)
- Datadog / New Relic (APM)
- Sentry (crash reporting)
- PagerDuty (alerting)
- Splunk / ELK (SIEM)
- Cloudflare (DDoS, IP blocking)
- BullMQ (queues)

---

## 14. Shortcuts

- `Ctrl+Shift+H` Health
- `Ctrl+Shift+A` Alerts

---

## 15. Mobile / Print

- On-call mobile app (alerts + ack)
- Print: incident reports, post-mortems

---

## 16. Audit

- All admin actions logged
- Restores require approval + reason
- Maintenance windows tracked
- Configuration changes versioned

---

## 17. Tests

```typescript
describe('Backup Integrity', () => { /* hash, restore */ })
describe('DR Failover', () => { /* RTO/RPO */ })
describe('Alert Routing', () => { /* by severity */ })
describe('Cron Reliability', () => { /* retry, alerts */ })
describe('Queue Health', () => { /* worker scaling */ })
```

---

## 18. Edge Cases

| Case | Behavior |
|------|----------|
| Backup full but disk full | rotate + alert |
| Restore conflicts with current data | warn + manual confirmation |
| Multiple alerts same incident | dedupe + aggregate |
| Cron stuck running | timeout + kill |
| IP blocked but legitimate | manual review + unblock |
| Maintenance window overruns | extend + alert |

---

**نهاية #43** • 8 سيناريوهات • 12 جداول • 8 forms • 8 grids • 29 button • 8 reports
