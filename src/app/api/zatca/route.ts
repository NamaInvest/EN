import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest, hasPermission } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant/tenant-guard';
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
    const prisma = getPrisma(req as any);
    try {
        const auth = getUserFromRequest(req as any);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
        
        const isAdmin = ['admin', 'owner'].includes(auth.role) || await hasPermission(auth.userId, 'admin', prisma);
        if (!isAdmin) return NextResponse.json({ error: 'صلاحيات المدير مطلوبة' }, { status: 403 });

        const tenantId = requireTenantId(req as any);

        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { action, otp } = body;

        // Fetch CSR from DB
        const csrSetting = await prisma.setting.findFirst({ where: { key: 'zatca_certificate', tenantId } });
        
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

            // Save Compliance Tokens with tenant isolation
            const upserts = [
                { key: 'zatca_compliance_token', value: data.binarySecurityToken },
                { key: 'zatca_compliance_secret', value: data.secret },
                { key: 'zatca_compliance_request_id', value: String(data.requestID) }
            ];

            for (const u of upserts) {
                const existing = await prisma.setting.findFirst({ where: { key: u.key, tenantId } });
                if (existing) {
                    await prisma.setting.update({ where: { id: existing.id }, data: { value: u.value } });
                } else {
                    await prisma.setting.create({ data: { key: u.key, value: u.value, tenantId } });
                }
            }

            return NextResponse.json({ success: true, message: 'Compliance CSID obtained successfully.' });
        }

        if (action === 'production-csid') {
            const reqId = await prisma.setting.findFirst({ where: { key: 'zatca_compliance_request_id', tenantId } });
            const token = await prisma.setting.findFirst({ where: { key: 'zatca_compliance_token', tenantId } });
            const secret = await prisma.setting.findFirst({ where: { key: 'zatca_compliance_secret', tenantId } });

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

            // Save Production Tokens with tenant isolation
            const upserts = [
                { key: 'zatca_production_token', value: data.binarySecurityToken },
                { key: 'zatca_production_secret', value: data.secret }
            ];

            for (const u of upserts) {
                const existing = await prisma.setting.findFirst({ where: { key: u.key, tenantId } });
                if (existing) {
                    await prisma.setting.update({ where: { id: existing.id }, data: { value: u.value } });
                } else {
                    await prisma.setting.create({ data: { key: u.key, value: u.value, tenantId } });
                }
            }

            return NextResponse.json({ success: true, message: 'Production CSID obtained successfully. Phase 2 Active.' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        log.error('ZATCA onboarding error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function _GET(req: NextRequest) {
    const prisma = getPrisma(req as any);
    try {
        const auth = getUserFromRequest(req as any);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
        const tenantId = requireTenantId(req as any);

        const searchParams = req.nextUrl.searchParams;
        const type = searchParams.get('type');
        
        if (type === 'status') {
            const complianceToken = await prisma.setting.findFirst({ where: { key: 'zatca_compliance_token', tenantId } });
            const productionToken = await prisma.setting.findFirst({ where: { key: 'zatca_production_token', tenantId } });
            const csrSetting = await prisma.setting.findFirst({ where: { key: 'zatca_certificate', tenantId } });

            if (productionToken?.value) {
                return NextResponse.json({ status: 'connected', has_production_csid: true });
            } else if (complianceToken?.value) {
                return NextResponse.json({ status: 'compliance_passed', has_production_csid: false });
            } else if (csrSetting?.value) {
                return NextResponse.json({ status: 'compliance_csid', has_production_csid: false });
            } else {
                return NextResponse.json({ status: 'disconnected', has_production_csid: false });
            }
        }
        
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    } catch (error: any) {
        log.error('ZATCA GET status error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
