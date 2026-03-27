const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const https = require('https');

async function testOnboard() {
    console.log("Reading from Prisma DB...");
    const csrObj = await prisma.setting.findUnique({ where: { key: 'zatca_csr_base64' } });
    const envObj = await prisma.setting.findUnique({ where: { key: 'zatca_environment' } });
    
    if (!csrObj) {
        console.log("NO CSR FOUND IN DB");
        return;
    }
    const b64 = csrObj.value.trim();
    console.log(`Environment: ${envObj?.value || 'empty'}`);
    console.log(`CSR Length: ${b64.length}`);
    console.log(`CSR Start: ${b64.substring(0, 50)}...`);

    const otp = '123345'; // Dummy OTP just to test if we pass CSR structure
    const postData = JSON.stringify({ csr: b64 });
    const options = {
        hostname: 'gw-fatoora.zatca.gov.sa', port: 443, method: 'POST',
        headers: { 'OTP': otp, 'Accept-Version': 'V2', 'Content-Type': 'application/json' }
    };
    
    // Test Simulation
    options.path = '/e-invoicing/simulation/compliance';
    const reqSim = https.request(options, res => {
        let d = ''; res.on('data', c=>d+=c); res.on('end', () => console.log('Simulation:', d));
    });
    reqSim.write(postData); reqSim.end();
    
    // Test Core
    options.path = '/e-invoicing/core/compliance';
    const reqCore = https.request(options, res => {
        let d = ''; res.on('data', c=>d+=c); res.on('end', () => console.log('Core:', d));
    });
    reqCore.write(postData); reqCore.end();
}

testOnboard().catch(console.error);
