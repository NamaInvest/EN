# Migration Rules

## Never
- Rename tables directly in production.
- Drop columns without backup.
- Run destructive migration without approval.

## Required
- All migrations reversible.
- Backup before schema changes.
- Test on staging first.
- Large migrations use batches.
