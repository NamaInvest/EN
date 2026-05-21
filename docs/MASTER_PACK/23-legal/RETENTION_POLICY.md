# Data Retention Policy (PDPL & ZATCA Compliant)

This policy defines how long Namasoft retains different types of data across its services.

## 1. Financial Records (ZATCA Compliance)
- **Data Type**: Sales Invoices, Purchase Orders, Journal Entries, Tax Returns.
- **Retention Period**: **7 Years** from the end of the financial year.
- **Action Post-Retention**: Archived to cold storage (AWS Glacier), removed from active DB.

## 2. Personal Identifiable Information (PDPL Compliance)
- **Data Type**: Customer names, phone numbers, employee civil IDs.
- **Retention Period**: While active + **1 Year** post-termination of business relationship.
- **Action Post-Retention**: Data Anonymization (irreversible masking).

## 3. Audit Trails & Logs
- **Data Type**: Login history, system configuration changes.
- **Retention Period**: **7 Years** (for compliance audits).
- **Action Post-Retention**: Hard delete.

## 4. Application Debug Logs
- **Data Type**: HTTP access logs, error stack traces.
- **Retention Period**: **90 Days**.
- **Action Post-Retention**: Hard delete via daily cron job.
