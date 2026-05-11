import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { CommitmentsRegisterEngine } from '@/lib/commitments-register-engine';

async function _GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') ?? 'default';
  const asOf     = searchParams.get('asOf');
  const type     = searchParams.get('type');   // filter by CommitmentType
  const bucket   = searchParams.get('bucket'); // filter by maturityBucket

  const register = await CommitmentsRegisterEngine.generate(
    tenantId,
    asOf ? new Date(asOf) : undefined,
  );

  let items = register.items;
  if (type)   items = items.filter(i => i.type === type);
  if (bucket) items = items.filter(i => i.maturityBucket === bucket);

  return NextResponse.json({
    ...register,
    items,
    filteredCount: items.length,
  });
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
