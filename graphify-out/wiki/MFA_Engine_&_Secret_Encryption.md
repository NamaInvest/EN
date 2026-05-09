# MFA Engine & Secret Encryption

> 12 nodes · cohesion 0.26

## Key Concepts

- **MfaEngine** (9 connections) — `mfa-engine.ts`
- **.verify()** (4 connections) — `mfa-engine.ts`
- **mfa-engine.ts** (4 connections) — `mfa-engine.ts`
- **decryptSecret()** (3 connections) — `mfa-engine.ts`
- **.confirmEnrollment()** (3 connections) — `mfa-engine.ts`
- **._logAttempt()** (3 connections) — `mfa-engine.ts`
- **encryptSecret()** (2 connections) — `mfa-engine.ts`
- **.enroll()** (2 connections) — `mfa-engine.ts`
- **.verifyBackupCode()** (2 connections) — `mfa-engine.ts`
- **.disable()** (1 connections) — `mfa-engine.ts`
- **.regenerateBackupCodes()** (1 connections) — `mfa-engine.ts`
- **.trustDevice()** (1 connections) — `mfa-engine.ts`

## Relationships

- No strong cross-community connections detected

## Source Files

- `mfa-engine.ts`

## Audit Trail

- EXTRACTED: 35 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*