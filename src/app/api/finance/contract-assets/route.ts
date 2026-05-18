import { NextRequest, NextResponse } from 'next/server';
import { ContractAssetEngine } from '@/lib/contract-asset-engine';
import { withRoute } from "@/lib/api/with-route";
export const POST = withRoute(async ({ req, prisma, auth, tenant }) => {
    const body = await req.json();
    if (body.type === 'allocate') {
    const allocation = await ContractAssetEngine.allocateTransactionPrice(body.contractId, body.obligations);
    return NextResponse.json({ allocation });
    }
    if (body.type === 'recognize') {
    const result = await ContractAssetEngine.recognizeRevenue(body.contractId, body.obligationCode, body.percentComplete, body.totalPrice);
    return NextResponse.json({ result });
    }
    if (body.type === 'position') {
    const position = ContractAssetEngine.buildPosition(body.billedToDate, body.revenueRecognized);
    return NextResponse.json({ position });
    }
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }, { rateLimit: 'DEFAULT', tenantRequired: true });
