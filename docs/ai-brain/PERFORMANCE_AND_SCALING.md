
# Performance & Scaling
**Generated At:** 2026-05-14T11:46:55.234Z

## Known Bottlenecks
- Synchronous auto-journal creation can add 100-200ms to invoice saving. Acceptable for atomicity.
- ZATCA must be asynchronous. Do not block the user waiting for Fatoora clearance.

## Caching Opportunities
- Next.js App Router aggressively caches. Watch out for stale data in `(dashboard)`.
