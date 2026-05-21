import { encode } from 'gpt-tokenizer';

export interface ContextChunk {
  content: string;
  source: string;
}

export interface AllocatedContext {
  ragChunks: ContextChunk[];
  schemaHints: string;
  policies: string;
  history: any[];
  prompt: string;
}

export class ContextManager {
  private MAX_TOKENS = 16000;
  
  // Budgets
  private RAG_BUDGET = 0.30; // 30%
  private HISTORY_BUDGET = 0.20; // 20%
  private SCHEMA_BUDGET = 0.15; // 15%
  private POLICY_BUDGET = 0.15; // 15%
  // The remaining 20% is reserved for the AI's response

  public allocateContext(
    ragChunks: ContextChunk[], 
    schemaHints: string, 
    policies: string, 
    history: any[],
    userPrompt: string
  ): AllocatedContext {
    
    // Always include user prompt first
    const promptTokens = encode(userPrompt).length;
    let availableTokens = this.MAX_TOKENS - promptTokens - (this.MAX_TOKENS * 0.20); // Save 20% for output

    // 1. Policies (High priority for compliance)
    const policyLimit = Math.floor(this.MAX_TOKENS * this.POLICY_BUDGET);
    const policyTokens = encode(policies).length;
    let finalPolicies = policies;
    if (policyTokens > policyLimit) {
      // Truncate policy safely
      finalPolicies = this.truncateToTokens(policies, policyLimit);
    }
    availableTokens -= encode(finalPolicies).length;

    // 2. Schema Hints
    const schemaLimit = Math.floor(this.MAX_TOKENS * this.SCHEMA_BUDGET);
    const schemaTokens = encode(schemaHints).length;
    let finalSchema = schemaHints;
    if (schemaTokens > schemaLimit) {
      finalSchema = this.truncateToTokens(schemaHints, schemaLimit);
    }
    availableTokens -= encode(finalSchema).length;

    // 3. RAG Chunks (Top 8 reranked)
    const ragLimit = Math.floor(this.MAX_TOKENS * this.RAG_BUDGET);
    let finalRagChunks: ContextChunk[] = [];
    let currentRagTokens = 0;
    
    for (const chunk of ragChunks) {
      const chunkTokens = encode(chunk.content).length;
      if (currentRagTokens + chunkTokens <= ragLimit) {
        finalRagChunks.push(chunk);
        currentRagTokens += chunkTokens;
      } else {
        break; // Stop adding chunks once we hit the budget
      }
    }
    availableTokens -= currentRagTokens;

    // 4. History (Take remaining budget or up to 20%)
    const historyLimit = Math.max(availableTokens, Math.floor(this.MAX_TOKENS * this.HISTORY_BUDGET));
    let finalHistory: any[] = [];
    let currentHistoryTokens = 0;
    
    // Traverse history backwards to keep the most recent messages
    for (let i = history.length - 1; i >= 0; i--) {
      const msgTokens = encode(JSON.stringify(history[i])).length;
      if (currentHistoryTokens + msgTokens <= historyLimit) {
        finalHistory.unshift(history[i]);
        currentHistoryTokens += msgTokens;
      } else {
        break;
      }
    }

    return {
      ragChunks: finalRagChunks,
      schemaHints: finalSchema,
      policies: finalPolicies,
      history: finalHistory,
      prompt: userPrompt
    };
  }

  private truncateToTokens(text: string, maxTokens: number): string {
    const tokens = encode(text);
    if (tokens.length <= maxTokens) return text;
    
    // Not optimal for Arabic text, but tiktoken is generally byte-pair based.
    // In production we would decode the slice back to string.
    // For now, simple char slice approximation: 1 token ~= 4 chars
    return text.slice(0, maxTokens * 4) + '...';
  }
}
