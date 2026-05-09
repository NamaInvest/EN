# API Auth, Backups & Ingestion

> 22 nodes · cohesion 0.11

## Key Concepts

- **getPrisma()** (41 connections) — `prisma.ts`
- **PgvectorStore** (6 connections) — `vector/store/pgvector.adapter.ts`
- **pipeline.ts** (6 connections) — `vector/ingestion/pipeline.ts`
- **pgvector.adapter.ts** (5 connections) — `vector/store/pgvector.adapter.ts`
- **api-key-auth.ts** (4 connections) — `api/api-key-auth.ts`
- **backup-engine.ts** (3 connections) — `backup-engine.ts`
- **field-permission.ts** (3 connections) — `field-permission.ts`
- **BackupEngine** (3 connections) — `backup-engine.ts`
- **vendor-scoring.ts** (3 connections) — `vendor-scoring.ts`
- **IngestionPipeline** (2 connections) — `vector/ingestion/pipeline.ts`
- **.ingest()** (2 connections) — `vector/ingestion/pipeline.ts`
- **.performBackup()** (2 connections) — `backup-engine.ts`
- **.testRestore()** (2 connections) — `backup-engine.ts`
- **.count()** (2 connections) — `vector/store/pgvector.adapter.ts`
- **.delete()** (2 connections) — `vector/store/pgvector.adapter.ts`
- **authenticateApiKey()** (1 connections) — `api/api-key-auth.ts`
- **requireScope()** (1 connections) — `api/api-key-auth.ts`
- **applyFieldPermissions()** (1 connections) — `field-permission.ts`
- **calculateVendorScore()** (1 connections) — `vendor-scoring.ts`
- **.search()** (1 connections) — `vector/store/pgvector.adapter.ts`
- **.upsert()** (1 connections) — `vector/store/pgvector.adapter.ts`
- **vector-store.interface.ts** (1 connections) — `vector/store/vector-store.interface.ts`

## Relationships

- No strong cross-community connections detected

## Source Files

- `api/api-key-auth.ts`
- `backup-engine.ts`
- `field-permission.ts`
- `prisma.ts`
- `vector/ingestion/pipeline.ts`
- `vector/store/pgvector.adapter.ts`
- `vector/store/vector-store.interface.ts`
- `vendor-scoring.ts`

## Audit Trail

- EXTRACTED: 69 (74%)
- INFERRED: 24 (26%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*