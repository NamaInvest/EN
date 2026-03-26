const { Client } = require('pg');
const https = require('https');

async function main() {
    const client = new Client({
        connectionString: 'postgresql://postgres:nama_db_pass_2024@localhost:5432/nama_medical'
    });
    
    await client.connect();
    
    const res = await client.query("SELECT value FROM \"Setting\" WHERE key = 'zatca_csr_base64'");
    if (res.rows.length === 0) {
        console.log('NO CSR PRESENT IN DATABASE.');
        await client.end();
        return;
    }
    
    const csrValue = res.rows[0].value;
    console.log('CSR Length:', csrValue.length);
    console.log('CSR Snippet:', csrValue.substring(0, 50));
    
    const isBase64 = /^[a-zA-Z0-9+/]+={0,2}$/.test(csrValue.replace(/[\r\n\s]/g, ''));
    console.log('Is valid Base64 alphabet:', isBase64);

    const payload = JSON.stringify({csr: csrValue});
    console.log('Sending payload to ZATCA Compliance CSID API... OTP: 572432');
    
    const req = https.request({
        hostname: 'gw-fatoora.zatca.gov.sa',
        path: '/e-invoicing/developer-portal/compliance',
        method: 'POST',
        headers: {
            'OTP': '572432',
            'Accept-Version': 'V2',
            'Accept-Language': 'en',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
        }
    }, resHttp => {
        let body = '';
        resHttp.on('data', d => body += d);
        resHttp.on('end', () => {
            console.log('STATUS:', resHttp.statusCode);
            console.log('BODY:', body);
        });
    });
    
    req.on('error', e => console.error(e));
    req.write(payload);
    req.end();
    
    await client.end();
}

main().catch(console.error);
