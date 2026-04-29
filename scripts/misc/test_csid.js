const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    const req = await prisma.setting.findFirst({ where: { key: 'zatca_compliance_request_id' } });
    const tk = await prisma.setting.findFirst({ where: { key: 'zatca_compliance_token' } });
    const sc = await prisma.setting.findFirst({ where: { key: 'zatca_compliance_secret' } });
    
    if (!req || !tk || !sc) {
        console.log('Missing data in DB');
        return;
    }
    
    console.log('Request ID:', req.value);
    
    const auth = Buffer.from(tk.value + ':' + sc.value).toString('base64');
    
    const response = await fetch('https://gw-fatoora.zatca.gov.sa/e-invoicing/simulation/production/csids', {
        method: 'POST',
        headers: {
            'Accept-Version': 'V2',
            'Authorization': 'Basic ' + auth,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ compliance_request_id: req.value })
    });
    
    const txt = await response.text();
    console.log('HTTP Status:', response.status);
    console.log('ZATCA Response:', txt);
}

test().catch(console.error).finally(() => prisma.$disconnect());
