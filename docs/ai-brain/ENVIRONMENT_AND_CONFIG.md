# ENVIRONMENT AND CONFIG

## Key Variables
- `DATABASE_URL`: Primary Postgres connection.
- `JWT_SECRET`: Core secret for decoding auth tokens and ICE sessions.
- `CLERK_SECRET_KEY`: For tenant user sync.
- `CRON_SECRET`: Protects cron APIs.

## Configs
- `next.config.ts`: Handles CSP, bundle splitting, and Electron custom outputs.
