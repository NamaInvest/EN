# 80 — Auth & SSO | المصادقة والصلاحيات

## 🔴 الأولوية: حرج

## 🔍 الموجود
- Clerk authentication
- 2FA basic
- TrustedDevice, MfaAttempt models
- UserPermission

## 🔴 الفجوات
- لا SSO (SAML, OIDC) للـ Enterprise
- RBAC بسيط
- لا field-level permissions
- لا row-level security
- لا time-bound permissions
- لا session management متقدم
- لا API keys runtime
- لا OAuth 2.0 apps (للـ third-party)
- Passkeys / WebAuthn ضعيف

## 🎯 الخطة

### 80.1 — RBAC Engine متقدم (8 أيام)
```typescript
// Permissions hierarchy
Permission = {
  resource: 'sales.invoice',
  action: 'create' | 'read' | 'update' | 'delete' | 'approve' | 'post',
  scope: 'own' | 'branch' | 'tenant' | 'all',
  conditions?: {
    amount: { max: 100000 },
    customers: ['VIP_only'],
  },
};

Role = {
  name: 'sales_manager',
  permissions: Permission[],
  inheritsFrom: ['sales_user'],
};
```

### 80.2 — Field-Level Permissions (5 أيام)
- Per-field read/write
- Mask sensitive fields (salaries من غير مدير الموارد البشرية)
- Audit on access
- Override workflows

### 80.3 — Row-Level Security (5 أيام)
- "Sales rep يرى عملاءه فقط"
- "Manager يرى فرعه فقط"
- Hierarchical (manager → all subordinates)
- Implementation via PostgreSQL RLS

### 80.4 — SAML / OIDC SSO (8 أيام)
- Microsoft Azure AD
- Google Workspace
- Okta
- OneLogin
- Custom SAML providers
- Just-in-Time provisioning

### 80.5 — SCIM Provisioning (5 أيام)
- Auto-create users from IdP
- Auto-deactivate on departure
- Group → role mapping
- Bulk operations

### 80.6 — MFA Enhancement (5 أيام)
- TOTP (Google Authenticator)
- WebAuthn / Passkeys (FIDO2)
- SMS (للحالات الطارئة)
- Backup codes
- Hardware tokens (YubiKey)
- Adaptive (based on risk)

### 80.7 — Session Management (4 أيام)
- Active sessions list
- Revoke specific session
- Auto-logout idle
- Device tracking
- Suspicious login alerts

### 80.8 — OAuth 2.0 Provider (8 أيام)
For third-party apps:
- Authorization code flow
- PKCE (mandatory)
- Refresh tokens
- Scopes
- Consent screen
- App registration UI
- Revocation

### 80.9 — Passwordless (5 أيام)
- Magic links (email)
- Passkeys (preferred)
- WebAuthn

### 80.10 — Risk-Based Auth (6 أيام)
- IP reputation
- Device fingerprinting
- Geolocation anomalies
- Velocity checks
- Step-up auth on high-risk

## 📊 KPIs
| KPI | قبل | بعد |
|-----|-----|-----|
| SSO supported | لا | 5+ providers |
| MFA adoption | جزئي | > 80% |
| Field-level perms | لا | كامل |
| Suspicious login alerts | لا | تلقائي |

## ⏱️ المدة: 59 يوم عمل
