# ⚡ Skill — nama-performance-load-testing

## Purpose
إثبات كفاءة الأداء والتحمل للعمليات الجوهرية (Checkout, POS, Invoicing) ومطابقة ميزانية SLO.

## Focus Areas
- Login
- POS checkout
- Sales invoice creation
- Purchase flow
- Treasury payment
- Payroll run
- Financial closing
- Tenant routing
- API response time

## Allowed Actions
- Plan load testing k6 scripts
- Run performance simulations on local/staging environments
- Audit Prisma connection pool latency

## Forbidden Actions
- Production load testing
- Triggering DDoS-like spikes on production systems
- Overwriting production connections

## Outputs
- `PERFORMANCE_BASELINE_REPORT.md`
- `LOAD_TEST_RESULTS.md`
- `SCALABILITY_RISK_REGISTER.md`

## .ai-brain Updates
- `.ai-brain/01-current-state.md`
- `.ai-brain/08-performance-and-scalability.md`

## Evidence Tags
- `VERIFIED_BY_REPORT`

## Stop Conditions
- Stop immediately if target URL is identified as production. Only staging or local allowed.
