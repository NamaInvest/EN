# D3 — Security Plan

## الحالة الحالية
- `SECURITY.md` + `docs/security/security-plan.md` + `BUILD_PACK/02-SECURITY_PLAN.md` (5 nodes في graphify)
- `.github/workflows/codeql.yml` + `security-scan.yml` + `snyk.yml`
- MFA implemented
- `/admin/siem` dashboard (built in our session!)
- PDPL breach + DSR pages (built!)
- لا SOC 2 controls matrix
- لا ISO 27001 mapping
- لا formal pen-test report

## الفجوة (مقابل SOC 2 / ISO 27001 / PCI-DSS)
- لا controls matrix رسمية
- لا quarterly security reviews
- لا employee security training tracking
- لا formal incident response plan

## 🎯 Ready Prompt

```
المهمة: security plan SOC 2 + ISO 27001 ready.

السياق:
- PDPL compliance مطبّق في الكود
- SIEM dashboard موجود
- MFA + audit logs نشطة
- Sentry + Cloudflare WAF

المخرجات:
1) Controls Matrix:
   docs/MASTER_PACK/15-security/CONTROLS_MATRIX.md
   شامل:
   - SOC 2 Type II — 64 Trust Service Criteria
   - ISO 27001 Annex A — 114 controls
   - PDPL — 44 articles
   - PCI-DSS (إن كان POS يتعامل مع بطاقات)

   لكل control:
   | id | description | state ✅⚠️❌ | evidence_file | owner_role | last_reviewed | next_review |

2) Threat Model:
   docs/MASTER_PACK/15-security/threat-model.md
   STRIDE analysis per critical flow:
   - User auth flow
   - Payment processing
   - PDPL DSR fulfillment
   - Tenant isolation
   - File uploads

3) Security Policies:
   docs/MASTER_PACK/15-security/policies/
   ├── information-security-policy.md
   ├── access-control-policy.md
   ├── data-classification-policy.md
   ├── incident-response-policy.md
   ├── secure-development-policy.md
   ├── third-party-risk-policy.md
   ├── business-continuity-policy.md
   ├── employee-acceptable-use-policy.md
   └── cryptography-policy.md

4) Incident Response Plan:
   docs/MASTER_PACK/15-security/IR_PLAN.md
   - Roles: IR Lead, Comms, Legal, Forensics
   - Severity tiers (Sev1-Sev4)
   - Communication templates (internal + customer + regulator)
   - Decision tree: contain → eradicate → recover → lessons learned
   - Tabletop exercises quarterly

5) Vulnerability Management:
   - Snyk already configured
   - Add Dependabot for direct deps
   - SBOM generation (sbom.yml workflow exists)
   - Track all CVEs in JIRA queue
   - SLA: Critical 24h, High 7d, Medium 30d

6) Pen-test schedule:
   - Annual external pen-test
   - Quarterly internal red-team
   - Bug bounty program (HackerOne)
   - Document scope في docs/MASTER_PACK/15-security/pen-test-scope.md

7) Compliance Audits:
   - Quarterly internal audit
   - Annual SOC 2 Type II audit (external)
   - Annual ISO 27001 recertification
   - Saudi PDPL self-assessment monthly

8) Training:
   - All employees: annual security awareness
   - Developers: secure code training
   - Track completion in /admin/training-compliance

القيود:
- لا public exposure للـ secrets/PII في docs
- evidence files مُسجّلة بـ hash
- review schedule مُتابع آلياً
```

## السيناريو

عميل enterprise يطلب SOC 2 Type II report قبل التعاقد:

1. PM يفتح `docs/MASTER_PACK/15-security/CONTROLS_MATRIX.md`
2. يصدّر للعميل (PDF) — 64 control موثق
3. عميل يطلب تفاصيل CC6.1 (logical access):
   - PM يرسل: link لـ MFA implementation + audit logs evidence
4. عميل يطلب SOC 2 auditor session:
   - Auditor يفتح evidence repository
   - يتحقق من كل control حياً
   - يكتب opinion letter
5. PM يحصل على SOC 2 report → يرفعه للـ Trust Center

**حادث أمني real-time**:
1. SIEM يكشف brute-force attack
2. Auto-block IP في WAF
3. Notify IR Lead via Telegram
4. IR Lead يفتح `IR_PLAN.md` Sev2 playbook
5. Containment: rotate keys, block IPs
6. Forensics: download logs, snapshot DB
7. Communication: internal + (إن لزم) customer + (PDPL) regulator خلال 72h
8. Post-mortem: 5-whys analysis

## Data Flow

```
[Threat detection flow]
User actions
   ↓
Audit logs + Sentry + WAF logs
   ↓
SIEM aggregator (/admin/siem)
   ↓
Pattern detection:
   - 5 failed MFA from same IP → brute force alert
   - PII export > 1000 rows → potential exfil
   - Privilege escalation → admin alert
   ↓
Alerts → Telegram + Slack + Email
   ↓
IR Lead acknowledges
   ↓
Open incident in /admin/incidents

[Compliance review flow]
Quarterly @ 1st of month
   ↓
scripts/compliance-review.ts
   ↓
For each control in matrix:
   - last_reviewed > 90 days ago?
   - evidence file exists + valid?
   - owner_role still in system?
   ↓
Generate report
   ↓
Email to compliance officer
   ↓
Officer updates state ✅/⚠️/❌
   ↓
Track in /admin/compliance-dashboard

[Audit trail flow]
Any sensitive action (read PII, change role, post JE)
   ↓
withRoute auto-logs:
   {
     userId, tenantId, action,
     entityType, entityId,
     timestamp, ipAddress, userAgent,
     oldValue, newValue
   }
   ↓
audit_logs table (append-only, encrypted at rest)
   ↓
Retention: 7 years (ZATCA + SOCPA requirement)
   ↓
Quarterly archive to S3 Glacier
```

## ملفات المُنتَج

- `docs/MASTER_PACK/15-security/CONTROLS_MATRIX.md`
- `docs/MASTER_PACK/15-security/threat-model.md`
- `docs/MASTER_PACK/15-security/policies/*.md` × 9
- `docs/MASTER_PACK/15-security/IR_PLAN.md`
- `docs/MASTER_PACK/15-security/pen-test-scope.md`
- `scripts/compliance-review.ts`
- `src/app/(dashboard)/admin/incidents/page.tsx` (extends siem)
- `src/app/(dashboard)/admin/compliance-dashboard/page.tsx`
- `src/app/(dashboard)/admin/training-compliance/page.tsx`
