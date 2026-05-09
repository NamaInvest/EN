# R2 Storage & Asset Upload

> 9 nodes · cohesion 0.25

## Key Concepts

- **R2Storage** (4 connections) — `storage/r2.ts`
- **AssetUploadPipeline** (4 connections) — `storage/upload-pipeline.ts`
- **upload-pipeline.ts** (3 connections) — `storage/upload-pipeline.ts`
- **r2.ts** (2 connections) — `storage/r2.ts`
- **.delete()** (1 connections) — `storage/r2.ts`
- **.upload()** (1 connections) — `storage/r2.ts`
- **.constructor()** (1 connections) — `storage/upload-pipeline.ts`
- **.uploadDocument()** (1 connections) — `storage/upload-pipeline.ts`
- **.uploadImage()** (1 connections) — `storage/upload-pipeline.ts`

## Relationships

- No strong cross-community connections detected

## Source Files

- `storage/r2.ts`
- `storage/upload-pipeline.ts`

## Audit Trail

- EXTRACTED: 18 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*