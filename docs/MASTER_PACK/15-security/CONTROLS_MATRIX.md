# Namasoft Security Controls Matrix

| ID | Description | Frameworks | State | Evidence File | Owner Role | Last Reviewed | Next Review |
|---|---|---|---|---|---|---|---|
| CC6.1 | Logical access controls (MFA required) | SOC 2 | ✅ | `src/lib/auth/mfa.ts` | CISO | 2026-05-01 | 2026-08-01 |
| CC6.2 | Role-based access control (RBAC) | SOC 2 | ✅ | `src/lib/auth/rbac.ts` | CISO | 2026-05-01 | 2026-08-01 |
| CC7.1 | System operations monitoring (SIEM) | SOC 2, ISO A.12.4 | ✅ | `src/app/(dashboard)/admin/siem/page.tsx` | SecOps | 2026-05-01 | 2026-08-01 |
| CC7.2 | Incident response procedures | SOC 2, ISO A.16.1 | ⚠️ | `docs/MASTER_PACK/15-security/IR_PLAN.md` | SecOps | 2026-05-21 | 2026-08-21 |
| CC8.1 | Change management (Code review & CI/CD) | SOC 2, ISO A.14.2 | ✅ | `.github/workflows/ci.yml` | DevOps | 2026-05-01 | 2026-08-01 |
| PDPL-A14 | Data Subject Rights (DSR) fulfillment | PDPL | ✅ | `src/app/(dashboard)/admin/dsr/page.tsx` | DPO | 2026-05-01 | 2026-06-01 |
| PDPL-A29 | Data breach notification (72h SLA) | PDPL | ⚠️ | `docs/MASTER_PACK/15-security/IR_PLAN.md` | DPO | 2026-05-21 | 2026-06-21 |
| ISO-A.9.2 | User registration and de-registration | ISO 27001 | ✅ | `src/services/auth/registration.service.ts` | IT Admin | 2026-05-01 | 2026-08-01 |
| ISO-A.12.3 | Cryptographic controls (Data at rest) | ISO 27001 | ✅ | `infra/terraform/hetzner.tf` | DevOps | 2026-05-01 | 2026-08-01 |
