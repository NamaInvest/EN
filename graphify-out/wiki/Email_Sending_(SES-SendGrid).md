# Email Sending (SES/SendGrid)

> 7 nodes · cohesion 0.38

## Key Concepts

- **email.ts** (6 connections) — `email.ts`
- **sendEmail()** (3 connections) — `email.ts`
- **sendViaSendGrid()** (2 connections) — `email.ts`
- **sendViaSES()** (2 connections) — `email.ts`
- **invoiceEmailTemplate()** (1 connections) — `email.ts`
- **passwordResetTemplate()** (1 connections) — `email.ts`
- **welcomeEmailTemplate()** (1 connections) — `email.ts`

## Relationships

- No strong cross-community connections detected

## Source Files

- `email.ts`

## Audit Trail

- EXTRACTED: 16 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*