import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import QRCode from 'qrcode';
import * as crypto from 'crypto';

// Phase 1 and Phase 2 TLV Encoder
function tlvEncode(tag: number, value: string | Buffer) {
    const valueBuffer = Buffer.isBuffer(value) ? value : Buffer.from(value, 'utf8');
    const tagBuffer = Buffer.from([tag]);
    
    if (valueBuffer.length > 127) {
        return Buffer.concat([
            tagBuffer,
            Buffer.from([0x82, (valueBuffer.length >> 8) & 0xff, valueBuffer.length & 0xff]),
            valueBuffer
        ]);
    }
    const lengthBuffer = Buffer.from([valueBuffer.length]);
    return Buffer.concat([tagBuffer, lengthBuffer, valueBuffer]);
}

async function generateZatcaQRData(
    companyName: string, 
    taxNumber: string, 
    date: string, 
    total: string, 
    tax: string, 
    settingsDict?: Record<string, string>, 
    invoice?: any
) {
    const parts = [
        tlvEncode(1, companyName || 'اسم الشركة'),
        tlvEncode(2, taxNumber || '300000000000003'),
        tlvEncode(3, new Date(date).toISOString()),
        tlvEncode(4, total.toString()),
        tlvEncode(5, tax.toString())
    ];

    if (settingsDict && invoice && settingsDict['zatca_private_key']) {
        const hasProductionToken = !!settingsDict['zatca_production_token'];
        const hasComplianceToken = !!settingsDict['zatca_compliance_token'];

        if (hasProductionToken || hasComplianceToken) {
            try {
                // Formatting Private Key correctly for Node.js Crypto
                let rawKey = settingsDict['zatca_private_key'];
                let pemKey = rawKey;
                if (!pemKey.includes('BEGIN')) {
                    // Try SECP256K1 EC Header
                    pemKey = `-----BEGIN EC PRIVATE KEY-----\n${rawKey}\n-----END EC PRIVATE KEY-----`;
                }
                
                // Formatting Certificate correctly
                let certificateData = '';
                if (hasProductionToken) {
                    // ZATCA Production tokens are usually double base64 encoded
                    const certBase64 = settingsDict['zatca_production_token'];
                    certificateData = Buffer.from(certBase64, 'base64').toString('ascii');
                } else if (hasComplianceToken) {
                    const certBase64 = settingsDict['zatca_compliance_token'];
                    certificateData = Buffer.from(certBase64, 'base64').toString('ascii');
                }
                
                if (!certificateData.includes('BEGIN CERTIFICATE')) {
                    certificateData = `-----BEGIN CERTIFICATE-----\n${certificateData}\n-----END CERTIFICATE-----`;
                }

                // Tag 6: Invoice Hash (SHA-256)
                const invoiceContent = `${invoice.id}|${invoice.invoiceNumber || invoice.id}|${new Date(date).toISOString()}|${total}|${tax}|${taxNumber}`;
                const invoiceHashBuf = crypto.createHash('sha256').update(invoiceContent).digest();
                parts.push(tlvEncode(6, invoiceHashBuf));

                // Tag 7: ECDSA Signature
                const sign = crypto.createSign('SHA256');
                sign.update(invoiceContent);
                const signature = sign.sign(pemKey);
                parts.push(tlvEncode(7, signature));

                // Tag 8: Public Key DER
                const keyObj = crypto.createPublicKey(pemKey);
                const pubKeyDer = keyObj.export({ type: 'spki', format: 'der' });
                parts.push(tlvEncode(8, pubKeyDer));

                // Tag 9: Certificate Stamp (SHA-256)
                if (certificateData) {
                    const certStamp = crypto.createHash('sha256').update(certificateData).digest();
                    parts.push(tlvEncode(9, certStamp));
                }
            } catch (e: any) {
                console.error("Phase 2 Cryptographic QR error:", e.message);
                // Fallback: Don't break the entire QR generation if Phase 2 Crypto fails
            }
        }
    }

    const tlvs = Buffer.concat(parts).toString('base64');
    const qrDataUrl = await QRCode.toDataURL(tlvs, { width: 140, margin: 1 });
    return { tlvs, qrDataUrl };
}

export async function GET(req: NextRequest) {
    const prisma = getPrisma(req);
    try {
        const { searchParams } = new URL(req.url);
        const invoiceId = searchParams.get('invoiceId');
        
        let cName: string = (searchParams.get('companyName') as string) || '';
        let tNum: string = (searchParams.get('taxNumber') as string) || '';
        let date: string = (searchParams.get('date') as string) || new Date().toISOString();
        let total: string = (searchParams.get('total') as string) || '0';
        let tax: string = (searchParams.get('tax') as string) || '0';

        let settingsDict: Record<string, string> = {};
        let invoiceRecord: any = null;

        if (invoiceId) {
            const invoiceIdNum = Number(invoiceId);
            const invoice = await prisma.salesInvoice.findUnique({ where: { id: invoiceIdNum } });
            if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
            invoiceRecord = invoice;
            
            const settingsSet = await prisma.setting.findMany();
            settingsSet.forEach(s => settingsDict[s.key] = s.value || '');
            
            cName = settingsDict['company_name'] || settingsDict['company_name_ar'] || 'اسم الشركة';
            tNum = settingsDict['tax_number'] || '300000000000003';
            date = invoice.date ? invoice.date.toISOString() : new Date().toISOString();
            total = invoice.total ? invoice.total.toString() : '0';
            tax = invoice.taxValue ? invoice.taxValue.toString() : '0';
        }

        const { tlvs, qrDataUrl } = await generateZatcaQRData(cName, tNum, date, total, tax, settingsDict, invoiceRecord);
        return NextResponse.json({ success: true, qrBufferBase64: tlvs, qrDataUrl });

    } catch (e: any) {
        console.error('ZATCA QR Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const prisma = getPrisma(req);
    try {
        const body = await req.json();
        const invoiceId = body.invoiceId;
        
        let cName: string = (body.companyName as string) || '';
        let tNum: string = (body.taxNumber as string) || '';
        let date: string = (body.date as string) || new Date().toISOString();
        let total: string = body.total?.toString() || '0';
        let tax: string = body.tax?.toString() || '0';

        let settingsDict: Record<string, string> = {};
        let invoiceRecord: any = null;

        if (invoiceId) {
            const invoiceIdNum = Number(invoiceId);
            const invoice = await prisma.salesInvoice.findUnique({ where: { id: invoiceIdNum } });
            if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
            invoiceRecord = invoice;
            
            const settingsSet = await prisma.setting.findMany();
            settingsSet.forEach(s => settingsDict[s.key] = s.value || '');
            
            cName = settingsDict['company_name'] || settingsDict['company_name_ar'] || 'اسم الشركة';
            tNum = settingsDict['tax_number'] || '300000000000003';
            date = invoice.date ? invoice.date.toISOString() : new Date().toISOString();
            total = invoice.total ? invoice.total.toString() : '0';
            tax = invoice.taxValue ? invoice.taxValue.toString() : '0';
        }

        const { tlvs, qrDataUrl } = await generateZatcaQRData(cName, tNum, date, total, tax, settingsDict, invoiceRecord);
        return NextResponse.json({ success: true, qrBufferBase64: tlvs, qrDataUrl });

    } catch (e: any) {
        console.error('ZATCA QR Error POST:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
