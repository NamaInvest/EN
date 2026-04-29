const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    const csr = await prisma.setting.findFirst({ where: { key: 'zatca_csr_base64' } });
    if (!csr) {
        console.log('NO CSR FOUND IN DB!');
        return;
    }
    console.log('CSR Length:', csr.value.length);
    console.log('CSR Value:', csr.value);
    
    // Now try fetching
    const https = require('https');
    const data = JSON.stringify({csr: csr.value});
    const req = https.request({
        hostname: 'gw-fatoora.zatca.gov.sa', 
        path: '/e-invoicing/developer-portal/compliance', 
        method: 'POST', 
        headers: {
            'OTP': '123456', 
            'Accept-Version': 'V2', 
            'Accept-Language': 'en', 
            'Content-Type': 'application/json', 
            'Accept': 'application/json', 
            'Content-Length': Buffer.byteLength(data)
        }
    }, res => { 
        let body = ''; 
        res.on('data', d => body += d); 
        res.on('end', () => console.log('STATUS:', res.statusCode, 'BODY:', body)); 
    });
    req.on('error', e => console.error(e));
    req.write(data);
    req.end();
}

main().finally(() => prisma.$disconnect());
