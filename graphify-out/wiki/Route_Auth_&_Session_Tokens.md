# Route Auth & Session Tokens

> 16 nodes · cohesion 0.18

## Key Concepts

- **auth.ts** (12 connections) — `auth.ts`
- **with-route.ts** (8 connections) — `api/with-route.ts`
- **withRoute()** (6 connections) — `api/with-route.ts`
- **resolveTenant()** (6 connections) — `prisma.ts`
- **getUserFromRequest()** (5 connections) — `auth.ts`
- **_test-route.ts** (2 connections) — `api/_test-route.ts`
- **checkRateLimit()** (2 connections) — `api/with-route.ts`
- **getTokenFromRequest()** (2 connections) — `auth.ts`
- **hasPermission()** (2 connections) — `auth.ts`
- **verifyToken()** (2 connections) — `auth.ts`
- **comparePassword()** (1 connections) — `auth.ts`
- **generateSessionToken()** (1 connections) — `auth.ts`
- **generateToken()** (1 connections) — `auth.ts`
- **hashPassword()** (1 connections) — `auth.ts`
- **isLegacyAdmin()** (1 connections) — `auth.ts`
- **withGuard()** (1 connections) — `auth.ts`

## Relationships

- No strong cross-community connections detected

## Source Files

- `api/_test-route.ts`
- `api/with-route.ts`
- `auth.ts`
- `prisma.ts`

## Audit Trail

- EXTRACTED: 47 (89%)
- INFERRED: 6 (11%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*