import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const otpClean = body.otp || '123456';
        const settingCsr = await prisma.setting.findFirst({ where: { key: 'zatca_csr_base64' } });
        
        if (!settingCsr) return NextResponse.json({ error: 'CSR not generated yet' });

        const response = await fetch('https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal/compliance', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Accept-Version': 'V2',
                'Accept-Language': 'en',
                'OTP': otpClean,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ csr: settingCsr.value })
        });

        const txt = await response.text();
        return NextResponse.json({ status: response.status, body: txt, csr: settingCsr.value });
    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
