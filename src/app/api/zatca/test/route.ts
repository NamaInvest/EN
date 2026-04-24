import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import fs from 'fs';

export async function GET(req: NextRequest) {
    try {
        const tmpDir = '/tmp/debug_zatca_perfect';
        try { fs.mkdirSync(tmpDir, { recursive: true }); } catch(e){}

        // Perfect English CSR
        const strictConfig = "csr.common.name=TST-311985620700003-311985620700003\n" +
                             "csr.serial.number=1-NAMA|2-EGS|3-128a3910-1234-1234-1234-123456789012\n" +
                             "csr.organization.identifier=311985620700003\n" +
                             "csr.organization.unit.name=HeadOffice\n" +
                             "csr.organization.name=NAMA\n" +
                             "csr.country.name=SA\n" +
                             "csr.invoice.type=1100\n" +
                             "csr.location.address=Riyadh\n" +
                             "csr.industry.business.category=Medical";

        fs.writeFileSync(tmpDir + '/csr-config.properties', strictConfig);
        execSync('fatoora -csr -csrConfig ' + tmpDir + '/csr-config.properties -privateKey ' + tmpDir + '/pk.key -generatedCsr ' + tmpDir + '/csr.pem -pem');

        const csrPem = fs.readFileSync(tmpDir + '/csr.pem', 'utf-8');
        const csrBase64 = csrPem.replace(/-----[^-]+-----/g, '').replace(/[\r\n\s]/g, '');

        const otps = ['252740', '667050'];
        const results = [];
        let successFound = false;
        
        for (let otp of otps) {
            const res = await fetch('https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal/compliance', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Accept-Version': 'V2',
                    'Accept-Language': 'en',
                    'OTP': otp,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ csr: csrBase64 })
            });
            const text = await res.text();
            results.push({ otp, status: res.status, error: text });
            if (res.status === 200) successFound = true;
        }

        return NextResponse.json({ success: successFound, base64_length: csrBase64.length, results });
    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
