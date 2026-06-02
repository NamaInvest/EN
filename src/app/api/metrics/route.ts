import { NextRequest, NextResponse } from 'next/server';
import { getAllTenantRuntimeMetrics } from '@/lib/observability/tenant-telemetry';
import os from 'os';

export async function GET(request: NextRequest) {
  // 1. Security Authorization Check
  const authHeader = request.headers.get('Authorization');
  const expectedToken = process.env.PROMETHEUS_METRICS_TOKEN || 'NAMA_MOCK_METRICS_SECURE_TOKEN_2026';

  if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
    return new Response('Unauthorized - Secure metrics endpoint protected by token', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Bearer' }
    });
  }

  // 2. Aggregate Telemetry Counters
  const allMetrics = getAllTenantRuntimeMetrics();
  let prometheusOutput = '';

  // Hardware / System Telemetry
  prometheusOutput += '# HELP system_cpu_cores Total CPU cores available\n';
  prometheusOutput += '# TYPE system_cpu_cores gauge\n';
  prometheusOutput += `system_cpu_cores ${os.cpus().length}\n\n`;

  prometheusOutput += '# HELP system_memory_total_bytes Total system memory\n';
  prometheusOutput += '# TYPE system_memory_total_bytes gauge\n';
  prometheusOutput += `system_memory_total_bytes ${os.totalmem()}\n\n`;

  prometheusOutput += '# HELP system_memory_free_bytes Free system memory\n';
  prometheusOutput += '# TYPE system_memory_free_bytes gauge\n';
  prometheusOutput += `system_memory_free_bytes ${os.freemem()}\n\n`;

  prometheusOutput += '# HELP system_uptime_seconds System uptime in seconds\n';
  prometheusOutput += '# TYPE system_uptime_seconds counter\n';
  prometheusOutput += `system_uptime_seconds ${Math.floor(os.uptime())}\n\n`;

  // Tenant-aware Telemetry
  prometheusOutput += '# HELP tenant_operations_total Total transactions processed per tenant\n';
  prometheusOutput += '# TYPE tenant_operations_total counter\n';
  for (const [tenantId, metrics] of Object.entries(allMetrics)) {
    prometheusOutput += `tenant_operations_total{tenant_id="${tenantId}"} ${metrics.operationCount}\n`;
  }
  prometheusOutput += '\n';

  prometheusOutput += '# HELP tenant_financial_overrides_total Total soft-lock period overrides per tenant\n';
  prometheusOutput += '# TYPE tenant_financial_overrides_total counter\n';
  for (const [tenantId, metrics] of Object.entries(allMetrics)) {
    prometheusOutput += `tenant_financial_overrides_total{tenant_id="${tenantId}"} ${metrics.overrideCount}\n`;
  }
  prometheusOutput += '\n';

  prometheusOutput += '# HELP tenant_isolation_violations_total Total security isolation violations per tenant\n';
  prometheusOutput += '# TYPE tenant_isolation_violations_total counter\n';
  for (const [tenantId, metrics] of Object.entries(allMetrics)) {
    prometheusOutput += `tenant_isolation_violations_total{tenant_id="${tenantId}"} ${metrics.violationCount}\n`;
  }

  // 3. Return Standard Prometheus Response
  return new Response(prometheusOutput, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}
