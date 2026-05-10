import { z } from 'zod';
import { toolRegistry } from '../tool-registry';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.orchestrator' });

const DUMMY_TOOLS = [
  'create_journal_entry', 'forecast_cash_flow', 'compute_aging_report', 'budget_vs_actual', 'fx_revaluation_simulator',
  'generate_zatca_invoice', 'apply_credit_note', 'customer_credit_check', 'pricing_recommendation',
  'recommend_purchase_quantity', 'three_way_match', 'vendor_performance',
  'stock_revaluation', 'slow_moving_report', 'reorder_suggestion',
  'analyze_employee_performance', 'leave_balance', 'payroll_simulator',
  'detect_anomalies', 'suggest_cost_center', 'extract_invoice_ocr',
  'generate_pdf_report', 'send_email_summary', 'get_erp_metrics', 'get_customer_balance'
];

export function registerAllTools() {
  for (const toolName of DUMMY_TOOLS) {
    toolRegistry.register({
      name: toolName,
      description: `Tool for ${toolName.replace(/_/g, ' ')}`,
      schema: z.any(),
      handler: async (args, ctx) => {
        return { success: true, tool: toolName, executed: true };
      },
      permissions: [],
      cost: 'low'
    });
  }
}
