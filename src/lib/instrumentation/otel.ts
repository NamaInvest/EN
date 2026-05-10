import { logger } from '@/lib/logger';

const log = logger.child({ service: 'instrumentation.otel' });

// Stub for OpenTelemetry instrumentation
export function initOtel() {
  if (process.env.NODE_ENV === 'production') {
    log.info('[OTEL] Initializing OpenTelemetry tracing for namasoft-erp...');
    // Real implementation would use @opentelemetry/sdk-node
  }
}

initOtel();
