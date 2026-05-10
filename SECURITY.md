# 🔒 Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 2.x.x (current) | ✅ |
| 1.x.x | ❌ |

## 🚨 Reporting a Vulnerability

**Please do NOT open a public GitHub issue for security vulnerabilities.**

Report security issues by emailing: **security@namainvist.com**

Include the following:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (optional)

We will acknowledge receipt within **48 hours** and aim to provide a fix within **7 days** for critical issues.

## 🛡️ Security Measures in Place

- ✅ JWT authentication with HS256 signing
- ✅ Rate limiting: 10–100 req/min per tier (DEFAULT / FINANCIAL / STRICT)
- ✅ Zod input validation on all POST/PUT/PATCH endpoints
- ✅ Multi-tenant isolation via AsyncLocalStorage
- ✅ 9 Security headers + Content Security Policy (CSP)
- ✅ PDPL-compliant PII masking on all log output
- ✅ Field-level audit trail for all financial mutations
- ✅ MFA (TOTP) support for admin accounts
- ✅ bcrypt password hashing (cost factor 10)
- ✅ SQL injection protection via Prisma parameterized queries
- ✅ XSS protection via React's default escaping + CSP

## 🔑 Responsible Disclosure

We follow responsible disclosure principles. Security researchers who responsibly disclose vulnerabilities will be acknowledged in our CHANGELOG.
