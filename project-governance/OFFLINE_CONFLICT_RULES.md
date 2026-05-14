# Offline Conflict Resolution

## Conflict Priority

1. Server-approved financial records win.
2. Latest inventory count requires manual review.
3. Duplicate offline invoices use idempotency key.
4. Customer master updates use last-write-wins.
5. Pricing conflicts require manager approval.

## Offline Restrictions
- Cannot post journals offline.
- Cannot close accounting periods offline.
- Cannot modify cleared ZATCA invoices offline.
