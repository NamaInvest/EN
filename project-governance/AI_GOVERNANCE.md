# AI Governance Rules

## Forbidden
- Never rewrite entire modules unless requested.
- Never change DB schema without migration.
- Never modify accounting invariants.
- Never bypass permission checks.
- Never remove tenant filters.
- Never change ZATCA logic silently.

## Required
- Read related Brain files first.
- Mention impacted modules before coding.
- Mention risks before refactor.
- Update documentation after changes.

## High-Risk Areas
- Accounting
- Payroll
- ZATCA
- Treasury
- Tenant isolation
- Desktop sync
