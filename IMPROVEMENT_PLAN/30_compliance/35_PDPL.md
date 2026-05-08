# 35 — PDPL | نظام حماية البيانات الشخصية

## 🔴 الأولوية: حرج (قانوني)

## 🔍 الفجوات
- لا Privacy Policy واضح
- لا Consent Management
- لا Data Subject Rights workflow
- لا Right to Be Forgotten (RTBF)
- لا Data Retention Policies
- لا DPO (Data Protection Officer)
- لا Data Breach Notification
- لا Privacy Impact Assessment

## 🎯 الخطة

### 35.1 — Privacy Policy + Terms (3 أيام)
- Bilingual (Arabic + English)
- PDPL-compliant
- Clear consent for each purpose
- Easy to update

### 35.2 — Consent Management Platform (8 أيام)
```typescript
export class ConsentService {
  async grant(userId, purpose, version): Promise<Consent>;
  async revoke(userId, purpose): Promise<void>;
  async getActiveConsents(userId): Promise<Consent[]>;
  async checkConsent(userId, purpose): Promise<boolean>;
}
```
- Granular per purpose (marketing, analytics, AI training)
- Version tracking
- Easy revocation

### 35.3 — Data Subject Rights Workflow (10 أيام)
PDPL gives:
- **Right to access** — export all my data
- **Right to rectification** — correct wrong data
- **Right to erasure** — delete my data (RTBF)
- **Right to restrict processing**
- **Right to data portability**
- **Right to object**

```typescript
export class DataSubjectRightsService {
  async requestAccess(userId): Promise<DataExport>;        // ZIP file
  async requestErasure(userId, scope): Promise<DeletionPlan>;
  async requestPortability(userId): Promise<PortableData>; // JSON/CSV
  async requestRectification(userId, fields): Promise<void>;
}
```

### 35.4 — Right to Be Forgotten (RTBF) (8 أيام)
- Identify all personal data per user
- Anonymization vs deletion
- Cascade through:
  - Production DB
  - Backups
  - Analytics warehouse
  - AI training data
  - Vector DB
  - Logs
- Compliance window (30 days)
- Audit trail

### 35.5 — Data Retention Engine (5 أيام)
```yaml
# config/retention-policies.yml
sales_invoices: 10 years        # ZATCA requirement
customer_pii: 7 years            # commercial law
employee_records: 7 years        # labor law
marketing_consents: until_revoke
ai_chat_logs: 90 days
audit_logs: 5 years
session_logs: 30 days
```
- Auto-purge per policy
- Anonymization where retention required without identity

### 35.6 — Data Breach Notification (4 أيام)
- Detection mechanisms (Sentry, anomalies)
- Severity classification
- Notification within 72 hours (PDPL requirement)
- Affected users notification
- Authority notification (SDAIA)

### 35.7 — Privacy Impact Assessment (3 أيام)
- Template per new feature
- Risk assessment
- Mitigation actions

### 35.8 — DPO Dashboard (5 أيام)
- Active consents stats
- Pending data subject requests
- Retention policy compliance
- Breach incidents log

## 📊 KPIs
| KPI | قبل | بعد |
|-----|-----|-----|
| PDPL compliance | غير معلوم | full |
| RTBF response time | لا | < 30 يوم |
| Data export request | لا | < 7 أيام |
| Breach notification time | لا | < 72h |

## ⏱️ المدة: 46 يوم عمل
