# Nama Security Compliance Skill

## Purpose

Audit and govern security, secret hygiene, dependency risk, RBAC, SIEM, PDPL, and Saudi compliance evidence.

## Allowed Actions

- Read security reports.
- Read auth/security utilities.
- Run approved read-only security scanners if already installed.
- Generate security reports.
- Redact secrets.
- Update `.ai-brain/06-security-and-compliance.md`.
- Update `.ai-brain/07-saudi-compliance.md`.
- Update risk/gap/evidence registers.

## Forbidden Actions

- Printing secrets.
- Reading `.env` values.
- DB writes.
- Production access.
- Deploy.
- Migration.
- Runtime code changes without approval.
- Git push.

## Audit Focus

- gitleaks
- trufflehog
- semgrep
- npm audit
- CodeQL results
- RBAC
- MFA
- session/cookies
- file uploads
- rate limits
- SIEM events
- PDPL
- ZATCA evidence
- GOSI/WPS evidence
- SOCPA evidence

## Required Outputs

- `SECURITY_HARDENING_REPORT.md`
- `SECRET_SCAN_REPORT.md`
- `RBAC_ACCESS_MATRIX.md`
- `THREAT_MODEL.md`
- `PENTEST_READINESS_CHECKLIST.md`
- `SAUDI_COMPLIANCE_EVIDENCE_PACK.md`

## Stop Conditions

Stop immediately if secrets are detected.

## Approval Gates

- `GO_FOR_SECURITY_AND_COMPLIANCE_HARDENING_ONLY`
- `GO_FOR_SECRET_INCIDENT_REVIEW_ONLY`
- `GO_FOR_SAUDI_COMPLIANCE_CERTIFICATION_TRACK_ONLY`
