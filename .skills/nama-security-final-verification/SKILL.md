# 🛡️ Skill — nama-security-final-verification

## Purpose
التحقق النهائي من الأمان بعد إتمام عمليات الـ Remediation للحزم والأسرار.

## Allowed Tools (If installed)
- `npm audit`
- Custom Node.js secret scanners
- Gitleaks / Trufflehog / Semgrep / CodeQL (Read-only execution)

## Forbidden Actions
- Hiding high-severity warnings
- Production access
- Deploy updates

## Outputs
- `SECURITY_FINAL_VERIFICATION_REPORT.md`
- `NPM_AUDIT_FINAL_REPORT.md`
- `SECRET_SCAN_FINAL_REPORT.md`
- `SECURITY_REMAINING_RISKS.md`

## .ai-brain Updates
- `.ai-brain/01-current-state.md`
- `.ai-brain/06-security-and-compliance.md`

## Evidence Tags
- `VERIFIED_BY_COMMAND`
- `VERIFIED_BY_REPORT`

## Stop Conditions
- Stop on any live credential exposure or active deploy modifications.
