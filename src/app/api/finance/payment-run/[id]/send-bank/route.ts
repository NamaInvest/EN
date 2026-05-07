import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
    const prisma = getPrisma(req as any);
    try {
        const id = Number((await params).id);
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
