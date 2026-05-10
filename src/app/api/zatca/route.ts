import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'zatca' });

// ZATCA Sandbox endpoints
const ZATCA_API_BASE = 'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal';


const _POSTSchema = z.object({
  action: z.any().optional(),
  otp: z.any().optional(),
}).passthrough();

async function _POST(req: NextRequest) {
    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { action, otp } = body;

        // Fetch CSR from DB
        const csrSetting = await prisma.setting.findUnique({ where: { key: 'zatca_certificate' } });
        
        if (action === 'compliance-csid') {
            if (!csrSetting?.value) throw new Error('CSR not generated yet.');
            if (!otp) throw new Error('OTP is required.');

            // Remove PEM headers for ZATCA API base64 format
            const csrBase64 = csrSetting.value
                .replace('-----BEGIN CERTIFICATE REQUEST-----', '')
                .replace('-----END CERTIFICATE REQUEST-----', '')
                .replace(/\n/g, '')
                .replace(/\r/g, '');

            const response = await fetch(`${ZATCA_API_BASE}/compliance`, {
                method: 'POST',
                headers: {
                    'OTP': otp,
                    'Accept-Version': 'V2',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ csr: csrBase64 })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(JSON.stringify(data));

            // Save Compliance Tokens
            await prisma.setting.upsert({ where: { key: 'zatca_compliance_token' }, update: { value: data.binarySecurityToken }, create: { key: 'zatca_compliance_token', value: data.binarySecurityToken }});
            await prisma.setting.upsert({ where: { key: 'zatca_compliance_secret' }, update: { value: data.secret }, create: { key: 'zatca_compliance_secret', value: data.secret }});
            await prisma.setting.upsert({ where: { key: 'zatca_compliance_request_id' }, update: { value: String(data.requestID) }, create: { key: 'zatca_compliance_request_id', value: String(data.requestID) }});

            return NextResponse.json({ success: true, message: 'Compliance CSID obtained successfully.' });
        }

        if (action === 'production-csid') {
            const reqId = await prisma.setting.findUnique({ where: { key: 'zatca_compliance_request_id' } });
            const token = await prisma.setting.findUnique({ where: { key: 'zatca_compliance_token' } });
            const secret = await prisma.setting.findUnique({ where: { key: 'zatca_compliance_secret' } });

            if (!reqId?.value || !token?.value || !secret?.value) throw new Error('Compliance CSID missing.');

            const basicAuth = Buffer.from(`${token.value}:${secret.value}`).toString('base64');

            const response = await fetch(`${ZATCA_API_BASE}/production/csids`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${basicAuth}`,
                    'Accept-Version': 'V2',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ compliance_request_id: reqId.value })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(JSON.stringify(data));

            // Save Production Tokens
            await prisma.setting.upsert({ where: { key: 'zatca_production_token' }, update: { value: data.binarySecurityToken }, create: { key: 'zatca_production_token', value: data.binarySecurityToken }});
            await prisma.setting.upsert({ where: { key: 'zatca_production_secret' }, update: { value: data.secret }, create: { key: 'zatca_production_secret', value: data.secret }});

            return NextResponse.json({ success: true, message: 'Production CSID obtained successfully. Phase 2 Active.' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
