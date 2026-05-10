import { toolRegistry } from './tool-registry';
import { registerAllTools } from './tools';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.orchestrator' });

// Register all available ERP tools
registerAllTools();

// Setup LangSmith stub
export function initLangSmith() {
  if (process.env.LANGSMITH_API_KEY) {
    log.info('[LangSmith] Client initialized for namasoft-erp-prod');
  }
}

export { toolRegistry };
