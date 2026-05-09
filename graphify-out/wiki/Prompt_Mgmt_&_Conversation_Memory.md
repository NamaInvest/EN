# Prompt Mgmt & Conversation Memory

> 27 nodes · cohesion 0.15

## Key Concepts

- **langchain-orchestrator.ts** (11 connections) — `langchain-orchestrator.ts`
- **registry.ts** (11 connections) — `prompts/registry.ts`
- **getPrompt()** (10 connections) — `prompts/registry.ts`
- **llm-client.ts** (7 connections) — `llm-client.ts`
- **createRegistryChain()** (6 connections) — `langchain-orchestrator.ts`
- **ragas-runner.ts** (6 connections) — `prompts/eval/ragas-runner.ts`
- **logPromptUsage()** (6 connections) — `prompts/registry.ts`
- **ConversationMemory** (5 connections) — `context/conversation-memory.ts`
- **conversation-memory.ts** (5 connections) — `context/conversation-memory.ts`
- **renderPrompt()** (5 connections) — `prompts/registry.ts`
- **resolvePromptVersion()** (4 connections) — `prompts/ab-testing/traffic-splitter.ts`
- **.getRelevantHistory()** (4 connections) — `context/conversation-memory.ts`
- **runEvalSuite()** (4 connections) — `prompts/eval/ragas-runner.ts`
- **invokeChain()** (4 connections) — `langchain-orchestrator.ts`
- **callLLM()** (4 connections) — `llm-client.ts`
- **traffic-splitter.ts** (4 connections) — `prompts/ab-testing/traffic-splitter.ts`
- **evaluatePromptOutput()** (3 connections) — `prompts/eval/llm-judge.ts`
- **buildTools()** (3 connections) — `langchain-orchestrator.ts`
- **.estimateTokens()** (2 connections) — `context/conversation-memory.ts`
- **.summarize()** (2 connections) — `context/conversation-memory.ts`
- **redactPII()** (2 connections) — `prompts/system/guardrails/pii-redactor.ts`
- **extractTokenUsage()** (2 connections) — `langchain-orchestrator.ts`
- **getLcModules()** (2 connections) — `langchain-orchestrator.ts`
- **getModel()** (2 connections) — `langchain-orchestrator.ts`
- **llm-judge.ts** (2 connections) — `prompts/eval/llm-judge.ts`
- *... and 2 more nodes in this community*

## Relationships

- No strong cross-community connections detected

## Source Files

- `context/conversation-memory.ts`
- `langchain-orchestrator.ts`
- `llm-client.ts`
- `prompts/ab-testing/traffic-splitter.ts`
- `prompts/eval/llm-judge.ts`
- `prompts/eval/ragas-runner.ts`
- `prompts/registry.ts`
- `prompts/system/guardrails/pii-redactor.ts`

## Audit Trail

- EXTRACTED: 96 (81%)
- INFERRED: 23 (19%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*