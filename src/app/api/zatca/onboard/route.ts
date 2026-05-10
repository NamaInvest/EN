/**
 * ZATCA Phase 2 Onboarding API
 * Handles: CSR â†’ Compliance CSID â†’ Compliance Check â†’ Production CSID
 */
import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest, hasPermission } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'zatca/onboard' });


const _POSTSchema = z.object({
  action: z.any().optional(),
  otp: z.any().optional(),
}).passthrough();

async function _POST(request: NextRequest) {

    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'ط؛ظٹط± ظ…طµط±ط­' }, { status: 403 });
        
        const isAdmin = await hasPermission(auth.userId, 'admin', prisma);
        if (!isAdmin) return NextResponse.json({ error: 'طµظ„ط§ط­ظٹط§طھ ط§ظ„ظ…ط¯ظٹط± ظ…ط·ظ„ظˆط¨ط©' }, { status: 403 });

        const body = await request.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { action, otp } = body;

        if (action === 'clear_settings') {
            // Clear all ZATCA settings
            await prisma.setting.deleteMany({
                where: {
                    key: {
                        in: [
                            'zatca_production_token', 'zatca_private_key',
                            'zatca_certificate', 'zatca_production_secret',
                            'zatca_last_pih', 'zatca_invoice_counter',
                        ],
                    },
                },
            });
            return NextResponse.json({ success: true, message: 'طھظ… ط­ط°ظپ ط¨ظٹط§ظ†ط§طھ ZATCA ط¨ظ†ط¬ط§ط­' });
        }

        if (action === 'onboard') {
            if (!otp) return NextResponse.json({ error: 'ظٹط±ط¬ظ‰ ط¥ط¯ط®ط§ظ„ ط±ظ…ط² OTP' }, { status: 400 });

            // Get company settings
            const settings = await prisma.setting.findMany({ take: 100,
                where: { key: { in: ['company_name', 'company_name_en', 'tax_number', 'zatca_crn', 'zatca_street', 'zatca_building', 'zatca_district', 'zatca_city', 'zatca_city_en', 'zatca_postal_code', 'zatca_environment'] } }
            });
            const s: Record<string, string> = {};
            settings.forEach((st: any) => { s[st.key] = st.value ?? ''; });

            if (!s['tax_number'] || !s['company_name']) {
                return NextResponse.json({ error: 'ظٹط±ط¬ظ‰ طھط¹ط¨ط¦ط© ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ظ†ط´ط£ط© ط£ظˆظ„ط§ظ‹ (ط§ظ„ط§ط³ظ… + ط§ظ„ط±ظ‚ظ… ط§ظ„ط¶ط±ظٹط¨ظٹ)' }, { status: 400 });
            }

            try {
                const { EGS } = await import('zatca-xml-js');
                const crypto = require('crypto');
                
                const egsInfo = {
                    uuid: crypto.randomUUID(),
                    custom_id: s['zatca_crn'] || '1010010000',
                    model: 'NamaInvest-ERP',
                    CRN_number: s['zatca_crn'] || '1010010000',
                    VAT_name: s['company_name'],
                    VAT_number: s['tax_number'],
                    location: {
                        city: s['zatca_city_en'] || s['zatca_city'] || 'Riyadh',
                        city_subdivision: s['zatca_district'] || 'District',
                        street: s['zatca_street'] || 'Main',
                        plot_identification: '0000',
                        building: s['zatca_building'] || '0000',
                        postal_zone: s['zatca_postal_code'] || '00000',
                    },
                    branch_name: s['company_name_en'] || s['company_name'] || 'Main',
                    branch_industry: 'General Trading',
                };

                const egs = new EGS(egsInfo);
                
                // Step 1: Generate keys and CSR
                const isProduction = s['zatca_environment'] === 'production';
                await egs.generateNewKeysAndCSR(isProduction, 'NamaInvest');
                log.info('âœ… Keys and CSR generated');

                // Step 2: Get Compliance Certificate
                const compliance_rid = await egs.issueComplianceCertificate(otp);
                log.info('âœ… Compliance CSID obtained, request_id:', compliance_rid);

                // Step 3: Sign a test invoice for compliance check
                const { ZATCASimplifiedTaxInvoice } = await import('zatca-xml-js');
                const testInvoice = new ZATCASimplifiedTaxInvoice({
                    props: {
                        egs_info: egs.get(),
                        invoice_counter_number: 1,
                        invoice_serial_number: 'TEST-001',
                        issue_date: new Date().toISOString().split('T')[0],
                        issue_time: new Date().toISOString().split('T')[1]?.substring(0, 8) || '00:00:00',
                        previous_invoice_hash: 'NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2ZiNTdlOQ==',
                        line_items: [{
                            id: '1',
                            name: 'Test Item',
                            quantity: 1,
                            tax_exclusive_price: 100,
                            VAT_percent: 15,
                        }],
                    }
                });

                const egsData = egs.get();
                const { signed_invoice_string, invoice_hash } = testInvoice.sign(
                    egsData.compliance_certificate || '',
                    egsData.private_key || ''
                );
                log.info('âœ… Test invoice signed');

                // Step 4: Check compliance
                await egs.checkInvoiceCompliance(signed_invoice_string, invoice_hash);
                log.info('âœ… Compliance check passed');

                // Step 5: Issue production certificate
                await egs.issueProductionCertificate(compliance_rid);
                log.info('âœ… Production CSID obtained');

                // Step 6: Save to database
                const finalEgs = egs.get();
                const productionToken = finalEgs.production_certificate 
                    ? Buffer.from(finalEgs.production_certificate).toString('base64') 
                    : '';

                const { encrypt } = await import('@/lib/encryption');
                const encryptedPrivateKey = encrypt(finalEgs.private_key || '');

                const upserts = [
                    { key: 'zatca_production_token', value: productionToken, description: 'ZATCA Production Token (BST)' },
                    { key: 'zatca_private_key', value: encryptedPrivateKey, description: 'ZATCA Private Key (Encrypted)' },
                    { key: 'zatca_production_secret', value: finalEgs.production_api_secret || '', description: 'ZATCA Production Secret' },
                    { key: 'zatca_last_pih', value: 'NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2ZiNTdlOQ==', description: 'ZATCA Last PIH' },
                    { key: 'zatca_invoice_counter', value: '0', description: 'ZATCA Invoice Counter' },
                    { key: 'zatca_enabled', value: '1', description: 'ZATCA Enabled' },
                ];

                for (const u of upserts) {
                    await prisma.setting.upsert({
                        where: { key: u.key },
                        update: { value: u.value },
                        create: { key: u.key, value: u.value, description: u.description },
                    });
                }

                return NextResponse.json({
                    success: true,
                    message: 'طھظ… ط§ظ„طھظپط¹ظٹظ„ ط¨ظ†ط¬ط§ط­! ط§ظ„ط¢ظ† ظٹظ…ظƒظ†ظƒ ط¥طµط¯ط§ط± ظپظˆط§طھظٹط± ط¥ظ„ظƒطھط±ظˆظ†ظٹط© ظ…طھظˆط§ظپظ‚ط© ظ…ط¹ ZATCA',
                    data: {
                        crn: finalEgs.CRN_number,
                        vatName: finalEgs.VAT_name,
                        vatNumber: finalEgs.VAT_number,
                        environment: s['zatca_environment'] || 'production',
                    }
                });

            } catch (onboardErr: any) {
                log.error('ZATCA Onboarding Error', { message: onboardErr.message, stack: onboardErr.stack });
                return NextResponse.json({ 
                    error: `ظپط´ظ„ ط§ظ„طھظپط¹ظٹظ„: ${onboardErr.message}`,
                    details: onboardErr.stack
                }, { status: 500 });
            }
        }

        return NextResponse.json({ error: 'ط¥ط¬ط±ط§ط، ط؛ظٹط± ظ…ط¹ط±ظˆظپ' }, { status: 400 });
    } catch (error: any) {
        log.error('ZATCA Onboard API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });

