# Risk-Based Testing Matrix

High-risk components require stricter testing thresholds, mutation testing, and mandatory code review approvals.

| Feature / Engine | Impact | Likelihood of Bug | Risk Level | Required Coverage | Mutation Test |
|------------------|:------:|:-----------------:|:----------:|:-----------------:|:-------------:|
| `auto-journal.ts`| High   | High              | 🔴 CRITICAL | 100%              | Yes (≥ 80%)   |
| Payroll Engine   | High   | Medium            | 🔴 CRITICAL | 95%               | Yes (≥ 80%)   |
| ZATCA Phase 2    | High   | High              | 🔴 CRITICAL | 95%               | Yes (≥ 80%)   |
| Credit Check     | Medium | Medium            | 🟡 HIGH     | 80%               | No            |
| WHT Form 14      | High   | Low               | 🟡 HIGH     | 80%               | No            |
| POS UI Actions   | Medium | High              | 🟡 HIGH     | 70% (E2E heavy)   | No            |
| Dashboard Charts | Low    | Medium            | 🟢 LOW      | 50%               | No            |
| Settings/Config  | Low    | Low               | 🟢 LOW      | 50%               | No            |
