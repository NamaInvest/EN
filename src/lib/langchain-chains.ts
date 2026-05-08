/**
 * LangChain-Compatible Chains
 * ──────────────────────────────────────────────────────────
 * Pre-composed pipelines for complex AI tasks.
 */

import { executeTool } from './erp-tools';
import { aiEval } from './ai-eval';

export const chains = {
  /**
   * Analysis Chain: Fetches data -> Analyzes -> Summarizes
   */
  async runFinancialAnalysis(period: string, executeAi: (prompt: string) => Promise<string>) {
    // Step 1: Gather data
    const tb = await executeTool('get_trial_balance', { period });
    const is = await executeTool('get_income_statement', { period });
    
    // Step 2: Formulate prompt
    const prompt = `
      Please analyze the following financial data for period ${period}:
      Trial Balance: ${JSON.stringify(tb)}
      Income Statement: ${JSON.stringify(is)}
      
      Provide a brief executive summary highlighting key risks and opportunities.
      Format as JSON with keys: 'summary', 'risks', 'opportunities', 'score'.
    `;
    
    // Step 3: Execute AI
    const rawResult = await executeAi(prompt);
    
    // Step 4: Evaluate (optional validation)
    aiEval.evaluate('Provide financial analysis', 'Valid JSON with financial insights', rawResult, JSON.stringify({tb, is}));
    
    try {
      return JSON.parse(rawResult);
    } catch {
      return { summary: rawResult, error: 'Failed to parse JSON' };
    }
  },

  /**
   * Data Extraction Chain: Text -> Structure -> Verification
   */
  async extractInvoiceData(text: string, executeAi: (prompt: string) => Promise<string>) {
    const prompt = `
      Extract invoice details from this text:
      "${text}"
      
      Return JSON exactly matching:
      { "supplier": string, "total": number, "tax": number, "date": "YYYY-MM-DD" }
    `;
    const result = await executeAi(prompt);
    try {
      return JSON.parse(result);
    } catch {
      throw new Error("Failed to extract structured data");
    }
  }
};
