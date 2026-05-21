import { NextResponse } from 'next/server';
import { paymentRunChain } from '@/lib/chains/payment-run.chain';

const chainsMap: Record<string, any> = {
  'payment-run': paymentRunChain
};

export async function POST(
  request: Request,
  { params }: { params: { chain: string } }
) {
  try {
    const body = await request.json();
    const chainName = params.chain;
    
    const chain = chainsMap[chainName];
    if (!chain) {
      return NextResponse.json({ error: 'Chain not found' }, { status: 404 });
    }

    let result;
    if (body.action === 'resume' && body.stateId) {
      result = await chain.resume(body.stateId, body.payload);
    } else {
      result = await chain.invoke({
        tenantId: body.tenantId || 'DEFAULT',
        actor: body.actor || 'system',
        payload: body.payload || {}
      });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Chain Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
