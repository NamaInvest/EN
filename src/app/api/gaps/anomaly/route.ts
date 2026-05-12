import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { runAnomalyDetection, DETECTORS, explainAnomaly } from '@/lib/gaps';
import { prisma } from '@/lib/prisma';

const QuerySchema = z.object({
  tenantId: z.string().min(1),
  windowDays: z.coerce.number().min(1).max(365).optional(),
  detectors: z.string().optional(), // comma-separated
  threshold: z.coerce.number().min(0).max(100).optional(),
  persist: z.coerce.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const parsed = QuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { tenantId, windowDays, detectors, threshold, persist } = parsed.data;
  const findings = await runAnomalyDetection({
    tenantId,
    prisma,
    windowDays,
    detectors: detectors ? (detectors.split(',') as never) : undefined,
    scoreThreshold: threshold,
    autoCreateFindings: persist,
  });
  const enriched = findings.map((f) => ({ ...f, explanation: explainAnomaly(f) }));
  return NextResponse.json({
    summary: {
      total: findings.length,
      critical: findings.filter((f) => f.severity === 'CRITICAL').length,
      high: findings.filter((f) => f.severity === 'HIGH').length,
      detectors: DETECTORS.map((d) => d.name),
    },
    findings: enriched,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = QuerySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const result = await runAnomalyDetection({
    tenantId: parsed.data.tenantId,
    prisma,
    windowDays: parsed.data.windowDays,
    detectors: parsed.data.detectors ? (parsed.data.detectors.split(',') as never) : undefined,
    scoreThreshold: parsed.data.threshold,
    autoCreateFindings: parsed.data.persist ?? true,
  });
  return NextResponse.json({ created: result.length, findings: result.map((f) => ({ ...f, explanation: explainAnomaly(f) })) });
}
