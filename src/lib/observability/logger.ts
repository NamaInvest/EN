import { randomUUID } from 'crypto';

export interface LogContext {
  tenantId?: string;
  correlationId?: string;
  txId?: string;
  userId?: number | string;
  domain?: string;
  [key: string]: any;
}

export class EnterpriseLogger {
  private static format(level: string, message: string, context?: LogContext, error?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      correlationId: context?.correlationId || randomUUID(),
      tenantId: context?.tenantId || 'SYSTEM',
      txId: context?.txId,
      domain: context?.domain,
      userId: context?.userId,
      error: error ? (error instanceof Error ? error.stack : error) : undefined,
      ...context
    };

    // Strip undefined
    Object.keys(logEntry).forEach(key => (logEntry as any)[key] === undefined && delete (logEntry as any)[key]);

    return JSON.stringify(logEntry);
  }

  static info(message: string, context?: LogContext) {
    console.log(this.format('INFO', message, context));
  }

  static warn(message: string, context?: LogContext) {
    console.warn(this.format('WARN', message, context));
  }

  static error(message: string, context?: LogContext, error?: any) {
    console.error(this.format('ERROR', message, context, error));
  }

  static traceFinancialTx(txId: string, action: string, tenantId: string, details?: any) {
    this.info(`[FINANCIAL_TX] ${action}`, {
      tenantId,
      txId,
      domain: 'FINANCE',
      ...details
    });
  }

  static traceInventoryTx(txId: string, action: string, tenantId: string, details?: any) {
    this.info(`[INVENTORY_TX] ${action}`, {
      tenantId,
      txId,
      domain: 'INVENTORY',
      ...details
    });
  }
}
