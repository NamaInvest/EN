# AI Eval & ERP Tool Calling

> 16 nodes · cohesion 0.18

## Key Concepts

- **erp-tools.ts** (9 connections) — `erp-tools.ts`
- **ai-eval.ts** (6 connections) — `ai-eval.ts`
- **mcp-bridge.ts** (5 connections) — `mcp-bridge.ts`
- **getTool()** (4 connections) — `erp-tools.ts`
- **MCPBridge** (4 connections) — `mcp-bridge.ts`
- **langchain-chains.ts** (3 connections) — `langchain-chains.ts`
- **executeTool()** (3 connections) — `erp-tools.ts`
- **.callTool()** (3 connections) — `mcp-bridge.ts`
- **.handleRequest()** (3 connections) — `mcp-bridge.ts`
- **listTools()** (2 connections) — `erp-tools.ts`
- **prisma()** (2 connections) — `erp-tools.ts`
- **.listTools()** (2 connections) — `mcp-bridge.ts`
- **assessRelevance()** (1 connections) — `ai-eval.ts`
- **detectNumericHallucination()** (1 connections) — `ai-eval.ts`
- **jaccardSimilarity()** (1 connections) — `ai-eval.ts`
- **keywordCoverage()** (1 connections) — `ai-eval.ts`

## Relationships

- No strong cross-community connections detected

## Source Files

- `ai-eval.ts`
- `erp-tools.ts`
- `langchain-chains.ts`
- `mcp-bridge.ts`

## Audit Trail

- EXTRACTED: 47 (94%)
- INFERRED: 3 (6%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*