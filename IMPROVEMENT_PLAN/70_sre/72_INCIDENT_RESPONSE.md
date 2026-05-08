# 72 — Incident Response | إدارة الحوادث

## 🔴 الأولوية: حرج

## 🎯 الخطة

### 72.1 — On-Call Rotation (3 أيام)
**Tools:**
- PagerDuty (industry standard)
- Opsgenie (Atlassian)
- Linear / Better Stack (أرخص)

**Rotation:**
- Primary on-call (24/7 weekly)
- Secondary backup
- Escalation policies
- Override mechanism (planned absences)

### 72.2 — Severity Classification (2 أيام)
| Severity | Definition | Response | Examples |
|----------|-----------|---------|----------|
| **SEV1** | Production down for > 50% users | Page immediately | Site down، DB unreachable |
| **SEV2** | Major feature broken | Page immediately | ZATCA submission failing |
| **SEV3** | Degraded performance | Notify in business hours | Slow reports |
| **SEV4** | Minor issue | Ticket | UI glitch |
| **SEV5** | Cosmetic | Ticket | Typo |

### 72.3 — Incident Commander (IC) Role (3 أيام)
**Responsibilities:**
- Coordinate response
- Communicate with stakeholders
- Make decisions (rollback, hotfix)
- Document timeline
- Post-mortem facilitation

**IC Training:**
- 2-day course
- Shadow experienced ICs
- IC certification

### 72.4 — Runbooks (10 أيام)
**Per-Service Runbooks:**
- DB connection issues
- Redis outage
- ZATCA endpoint down
- Payment gateway failure
- Mass authentication failures
- High CPU / Memory
- Disk full
- Backup failure

**Each runbook contains:**
- Symptoms
- Investigation steps
- Mitigation steps
- Rollback procedure
- Post-fix validation

### 72.5 — Communication Templates (3 أيام)
**Internal:**
- Slack #incident-live
- Status updates every 15 min
- Resolution summary

**External:**
- Status page updates
- Customer email (for SEV1/2)
- Personalized for affected enterprises

### 72.6 — Post-Mortem Process (4 أيام)
**Within 5 business days of incident:**
1. Timeline reconstruction
2. Root cause analysis (5 Whys)
3. Contributing factors
4. What went well
5. What went poorly
6. Action items (with owners + due dates)
7. Blameless culture

**Template:**
```markdown
# Post-Mortem: [Incident Title]

**Date:** YYYY-MM-DD
**Severity:** SEV2
**Duration:** 47 minutes
**IC:** @username

## Summary
[2-3 sentences]

## Timeline (UTC)
- 14:23 — Alert fired
- 14:25 — IC paged
- ...

## Root Cause
[Detailed]

## What Went Well
- ...

## What Went Wrong
- ...

## Action Items
- [ ] Item 1 (@owner, due YYYY-MM-DD)
```

### 72.7 — Game Days (5 أيام / quarter)
- Simulate failures
- Test runbooks
- Train new ICs
- Identify gaps

### 72.8 — Incident Database (3 أيام)
- All incidents logged
- Searchable
- Trend analysis
- Recurring issues identification

## 📊 KPIs
| KPI | قبل | بعد |
|-----|-----|-----|
| MTTD (Mean Time to Detect) | غير مقاس | < 5 min |
| MTTR (Mean Time to Resolve) | غير مقاس | < 30 min |
| SEV1 incidents/quarter | غير متابع | < 2 |
| Post-mortem completion | لا | 100% |
| Action items completed | لا | > 90% |

## ⏱️ المدة: 33 يوم عمل + ongoing
