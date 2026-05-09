# SSO / SCIM

> 7 nodes · cohesion 0.43

## Key Concepts

- **SSOEngine** (5 connections) — `sso-engine.ts`
- **db()** (4 connections) — `sso-engine.ts`
- **.scimDeprovisionUser()** (2 connections) — `sso-engine.ts`
- **.scimProvisionUser()** (2 connections) — `sso-engine.ts`
- **.validateSSOSession()** (2 connections) — `sso-engine.ts`
- **sso-engine.ts** (2 connections) — `sso-engine.ts`
- **.generateSPMetadata()** (1 connections) — `sso-engine.ts`

## Relationships

- No strong cross-community connections detected

## Source Files

- `sso-engine.ts`

## Audit Trail

- EXTRACTED: 18 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*