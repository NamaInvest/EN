# Data Retention Policy

This document outlines the retention limits for various data types within Nama ERP.

| Data Type | Retention Period | Reason |
|---|---|---|
| Financial Invoices & Journals | 7 Years | ZATCA requirement & SOCPA |
| Employee Contracts & Payroll | 7 Years post-termination | Saudi Labor Law |
| Audit Logs | 7 Years | Security & Compliance |
| Customer PII | Account Active + 1 Year | PDPL Data Minimization |
| Marketing Data | 2 Years | Opt-in standard |
| Application Debug Logs | 90 Days | Operational usage |

Data exceeding these limits will be anonymized or archived automatically by the `retention-cleanup.ts` cron job.
