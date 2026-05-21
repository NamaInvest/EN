# Threat Model (STRIDE)

## 1. User Authentication Flow
- **Spoofing**: Attacker uses stolen credentials. 
  *Mitigation*: MFA enforced on all admin/financial roles. Rate limiting on login endpoint.
- **Tampering**: Attacker modifies JWT token.
  *Mitigation*: JWT signed with secure HS256 algorithm. Secret rotated every 90 days.
- **Repudiation**: User denies performing an action.
  *Mitigation*: Comprehensive AuditLog table tracks all state-changing API calls.

## 2. Payment Processing (Financial Integrity)
- **Information Disclosure**: Attacker reads cleartext bank details.
  *Mitigation*: Sensitive fields encrypted at rest using AES-256. API responses mask PII.
- **Denial of Service**: Attacker floods the payment endpoint.
  *Mitigation*: Cloudflare WAF + strict API rate limiting per tenant/IP.
- **Elevation of Privilege**: Regular user approves their own payment.
  *Mitigation*: Strict RBAC via `withRoute` + Maker/Checker workflow enforcement.

## 3. Tenant Isolation
- **Information Disclosure**: Tenant A accesses Tenant B's data via URL manipulation (IDOR).
  *Mitigation*: All `withRoute` wrappers require `tenantId`. Prisma queries implicitly filter by `tenantId`.

## 4. Document / File Uploads
- **Tampering**: Attacker uploads malicious shell script masked as PDF.
  *Mitigation*: S3 pre-signed URLs. Strict MIME-type checking. ClamAV scanning on upload stream.
