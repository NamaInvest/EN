import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import * as fs from 'fs';
import * as path from 'path';
import { ZatcaJavaAdapter } from '@/lib/zatca-java';

export async function POST(req: NextRequest) {
    try {
        const user = getUserFromRequest(req);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const settingsDict: Record<string, string> = {};
        const allSettings = await prisma.setting.findMany();
        allSettings.forEach((s: any) => settingsDict[s.key] = s.value);

        const companyName = settingsDict['company_name_en'] || 'Unknown Company';
        const taxNumber = settingsDict['tax_number'];
        const crn = settingsDict['zatca_crn'] || '1010010000';
        const street = settingsDict['zatca_street'] || 'Main Street';
        const building = settingsDict['zatca_building'] || '1234';
        const district = settingsDict['zatca_district'] || 'Al Olaya';
        const city = settingsDict['zatca_city_en'] || 'Riyadh';
        const postalCode = settingsDict['zatca_postal_code'] || '12211';
        const industry = settingsDict['zatca_industry'] || 'Retail';

        if (!taxNumber || taxNumber.length !== 15 || !taxNumber.startsWith('3') || !taxNumber.endsWith('3')) {
            return NextResponse.json({ error: 'الرقم الضريبي غير صالح. يجب أن يكون 15 رقماً ويبدأ وينتهي بـ 3' }, { status: 400 });
        }

        // Generate Keys using ZATCA Official Java SDK!
        const adapter = new ZatcaJavaAdapter();
        const { csr, privateKey } = await adapter.generateCsr({
            companyName,
            taxNumber,
            branchName: 'HeadOffice',
            businessCategory: industry,
            uuid: '1122334455',
            city,
            district,
            street
        });

        // The adapter returns base64 content
        const csrFull = Buffer.from(csr, 'base64').toString('ascii'); // Decode or store base64 directly? 
        // Wait, ZATCA SDK returns the ACTUAL PEM CONTENT inside the `cert.pem` file which I stripped headers from in ZatcaJavaAdapter to return `csrBase64`.
        // Let's store the pure base64 for private_key and csr_base64.
        const csrBase64 = csr;
        const privateKeyClean = privateKey;
        
        // ZATCA Certificate field expects PEM formatted CSR historically
        const csrPem = `-----BEGIN CERTIFICATE REQUEST-----\n${csrBase64}\n-----END CERTIFICATE REQUEST-----`;

        // Upsert into DB
        const updateTasks = [
            prisma.setting.upsert({ where: { key: 'zatca_private_key' }, update: { value: privateKeyClean }, create: { key: 'zatca_private_key', value: privateKeyClean } }),
            prisma.setting.upsert({ where: { key: 'zatca_certificate' }, update: { value: csrPem }, create: { key: 'zatca_certificate', value: csrPem } }),
            prisma.setting.upsert({ where: { key: 'zatca_csr_base64' }, update: { value: csrBase64 }, create: { key: 'zatca_csr_base64', value: csrBase64 } }),
        ];
        
        await Promise.all(updateTasks);

        return NextResponse.json({ 
            success: true, 
            message: 'تم توليد مفاتيح ZATCA و CSR بنجاح.'
        });

    } catch (e: any) {
        console.error('ZATCA Generate Keys Error:', e);
        return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
    }
}
