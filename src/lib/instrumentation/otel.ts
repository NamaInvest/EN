// Stub for OpenTelemetry instrumentation
export function initOtel() {
  if (process.env.NODE_ENV === 'production') {
    console.log('[OTEL] Initializing OpenTelemetry tracing for namasoft-erp...');
    // Real implementation would use @opentelemetry/sdk-node
  }
}

initOtel();
