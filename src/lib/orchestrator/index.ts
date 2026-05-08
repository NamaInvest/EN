import { toolRegistry } from './tool-registry';
import { registerAllTools } from './tools';

// Register all available ERP tools
registerAllTools();

// Setup LangSmith stub
export function initLangSmith() {
  if (process.env.LANGSMITH_API_KEY) {
    console.log('[LangSmith] Client initialized for namasoft-erp-prod');
  }
}

export { toolRegistry };
