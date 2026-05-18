# OPEN QUESTIONS

## 1. Unverified Edge Cases
- **Pharmacy Outbox Retry Limits**: If a `PHARMACY_PRESCRIPTION_DISPENSED` event fails 5 times and reaches `FAILED` status, is there a manual admin interface to requeue it, or does it require database intervention?
- **Global Period Locking**: Is the accounting period lock (`PeriodLock` model) strictly enforced at the Prisma level (via middleware) or only checked selectively in the application logic?

## 2. Ambiguous Logic
- **Master Data Syncing**: In the POS Desktop offline mode, what happens if an offline terminal creates a new customer, and simultaneously the Web Admin creates a customer with the same phone number? Does the sync service resolve this via soft-merge or hard-overwrite?
- **Soft Delete cascades**: If a `SalesInvoice` is soft-deleted (which shouldn't happen if POSTED, but assume it's Draft), do the corresponding `SalesInvoiceDetail` rows also get soft-deleted, or do they rely on relation filters?

## 3. Recommended Human Clarifications
- **ZATCA Key Rotation**: How are ZATCA Phase 2 Production CSID certificates rotated? Is there an automated cron job or is it a manual operational task triggered by ICE Admins?
- **Data Retention Policies**: For PDPL compliance, what is the exact timeline for purging old `AttendancePunch` logs or `OutboxEvent` histories?
