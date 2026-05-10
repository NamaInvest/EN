import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.instrumentat' });

// Stub for OpenTelemetry instrumentation
export function initOtel() {
  if (process.env.NODE_ENV === 'production') {
    log.info('[OTEL] Initializing OpenTelemetry tracing for namasoft-erp...');
    // Real implementation would use @opentelemetry/sdk-node
  }
}

initOtel();
