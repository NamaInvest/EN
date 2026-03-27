const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    const lPath = 'd:/namasoft9-3-main/src/app/api/zatca/test/route.ts';
    // Write the new test route locally first
    require('fs').writeFileSync(lPath, `
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
export async function GET(req: NextRequest) {
    try {
        const settings = await prisma.setting.findMany();
        const dict: any = {};
        settings.forEach((s: any) => dict[s.key] = s.value);
        return NextResponse.json({
            vat: dict.tax_number,
            crn: dict.zatca_crn,
            company: dict.company_name_en,
            city_en: dict.zatca_city_en,
            street: dict.zatca_street,
            branch_en: dict.branch_name_en,
            csr: dict.zatca_csr_base64
        });
    } catch (e: any) { return NextResponse.json({ error: e.message }); }
}
`);
    
    // SFTP to N2
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const rPath = '/www/wwwroot/n2.namainvist.com/src/app/api/zatca/test/route.ts';
        sftp.fastPut(lPath, rPath, (err) => {
            if (err) throw err;
            console.log('Test Route Uploaded. Rebuilding...');
            conn.exec('cd /www/wwwroot/n2.namainvist.com && npm run build && pm2 restart n2', (err, stream) => {
                stream.on('close', () => conn.end()).on('data', data => process.stdout.write(data.toString()));
            });
        });
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 60000});
