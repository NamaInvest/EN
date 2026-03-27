const fs = require('fs');
const https = require('https');
const crypto = require('crypto');
const { execSync } = require('child_process');

function doFetch(host, path, b64, otp) {
    return new Promise((resolve) => {
        const postData = JSON.stringify({ csr: b64 });
        const req = https.request({
            hostname: host, port: 443, path: path, method: 'POST',
            headers: {
                'Accept': 'application/json', 'Accept-Version': 'V2', 'Accept-Language': 'en',
                'OTP': otp, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData)
            }
        }, res => {
            let data = ''; res.on('data', c => data+=c);
            res.on('end', () => resolve({status: res.statusCode, body: data}));
        });
        req.on('error', e => resolve({status: 500, body: e.message}));
        req.write(postData); req.end();
    });
}

async function run() {
    const vat = '311985620700003';
    // User mentioned OTP: 123345 (Let's rely on it, even if it returns Invalid Request/OTP it means CSR passed!)
    const otp = '123345'; 

    // Production environment Strictly requires NO PREFIX
    const configCore = `csr.common.name=${vat}
csr.serial.number=1-NAMA|2-HeadOffice|3-11223344-5566-7788-9900-aabbccddeeff
csr.organization.identifier=${vat}
csr.organization.unit.name=HeadOffice
csr.organization.name=Jalsa Indian Restaurant
csr.country.name=SA
csr.invoice.type=1100
csr.location.address=Najran
csr.industry.business.category=Restaurant`;

    const tmp = '/tmp/zatca_core_' + Date.now();
    execSync(`mkdir -p ${tmp}`);

    const { privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'secp256k1', publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' }});
    fs.writeFileSync(`${tmp}/pk.key`, privateKey);
    fs.writeFileSync(`${tmp}/c.properties`, configCore);
    
    execSync(`fatoora -csr -csrConfig ${tmp}/c.properties -privateKey ${tmp}/pk.key -generatedCsr ${tmp}/csr.pem -pem`);
    const csrPem = fs.readFileSync(`${tmp}/csr.pem`, 'utf-8');
    const b64 = csrPem.replace(/-----[^-]+-----/g, '').replace(/[\r\n\s]/g, '');

    console.log('--- Testing CORE PRODUCTION (No Prefix) ---');
    console.log('[Core Portal] ', (await doFetch('gw-fatoora.zatca.gov.sa', '/e-invoicing/core/compliance', b64, otp)).body.slice(0, 300));
}
run();
