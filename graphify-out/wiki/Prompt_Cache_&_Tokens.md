# Prompt Cache & Tokens

> 10 nodes · cohesion 0.38

## Key Concepts

- **prompt-cache.ts** (10 connections) — `prompt-cache.ts`
- **getRedis()** (5 connections) — `prompt-cache.ts`
- **buildKey()** (4 connections) — `prompt-cache.ts`
- **setCachedPrompt()** (4 connections) — `prompt-cache.ts`
- **getCachedPrompt()** (3 connections) — `prompt-cache.ts`
- **clearCache()** (2 connections) — `prompt-cache.ts`
- **estimateTokens()** (2 connections) — `prompt-cache.ts`
- **getCacheStats()** (2 connections) — `prompt-cache.ts`
- **hashContent()** (2 connections) — `prompt-cache.ts`
- **pruneCache()** (1 connections) — `prompt-cache.ts`

## Relationships

- No strong cross-community connections detected

## Source Files

- `prompt-cache.ts`

## Audit Trail

- EXTRACTED: 35 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*