import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'finance.payment-run.id.send-bank' });

import { getUserFromRequest } from '@/lib/auth';

const _POSTSchema = z.object({}).passthrough();

async function _POST(req: Request, { params }: { params: Promise<{ id: string }> }) {

  const { id: paramId } = await params;
    const prisma = getPrisma(req as any);
    try {
        const auth = await getUserFromRequest(req as any);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        if (!['admin', 'owner', 'finance_manager', 'cfo'].includes(auth.role)) return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });

        const bodyText = await req.text();
        const body = bodyText ? JSON.parse(bodyText) : {};
        _POSTSchema.safeParse(body);

        const id = Number(paramId);

        // Verify tenant
        const run = await prisma.paymentRun.findFirst({ where: { id, tenantId: auth.tenantId } });
        if (!run) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const updated = await prisma.paymentRun.update({
            where: { id },
            data: {
                status: 'SENT_TO_BANK',
                sentToBankAt: new Date(),
                filesGeneratedAt: new Date()
            }
        });
        
        // Mock SARIE/SAMA XML generation
        const mockSarieXml = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03">
    <CstmrCdtTrfInitn>
        <GrpHdr>
            <MsgId>SAMA-SARIE-${updated.runNumber}</MsgId>
            <CreDtTm>${new Date().toISOString()}</CreDtTm>
            <NbOfTxs>${updated.totalCount}</NbOfTxs>
            <CtrlSum>${updated.totalAmount}</CtrlSum>
        </GrpHdr>
        <!-- payment lines omitted for brevity -->
    </CstmrCdtTrfInitn>
</Document>`;

        return NextResponse.json({ success: true, data: updated, xml: mockSarieXml });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }, context) => _POST(req as any, context), { rateLimit: 'DEFAULT' });
