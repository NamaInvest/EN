import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { APOCREngine } from '@/lib/ap-ocr-engine';

export const POST = withRoute(async ({ req, prisma, auth }) => {
  const body = await req.json();
  const { base64Image, mimeType, purchaseOrderId, poAmount } = body;
  if (!base64Image) return NextResponse.json({ error: 'base64Image required' }, { status: 400 });

  const extracted = await APOCREngine.extractFromBase64(base64Image, mimeType);
  const validation = poAmount ? APOCREngine.validateAgainstPO(extracted, poAmount) : undefined;
  return NextResponse.json({ extracted, validation });
}, { rateLimit: 'AI', tenantRequired: true });
