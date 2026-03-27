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
    const otp = '252740'; // Latest OTP from user

    const configSim = `csr.common.name=PRE-${vat}
csr.serial.number=1-NAMA|2-HeadOffice|3-11223344-5566-7788-9900-aabbccddeeff
csr.organization.identifier=${vat}
csr.organization.unit.name=HeadOffice
csr.organization.name=Jalsa Indian Restaurant
csr.country.name=SA
csr.invoice.type=1100
csr.location.address=Najran
csr.industry.business.category=Restaurant`;

    const tmp = '/tmp/zatca_sim_test_' + Date.now();
    execSync(`mkdir -p ${tmp}`);

    const { privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'secp256k1', publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' }});
    fs.writeFileSync(`${tmp}/pk.key`, privateKey);
    fs.writeFileSync(`${tmp}/c.properties`, configSim);
    
    execSync(`fatoora -csr -csrConfig ${tmp}/c.properties -privateKey ${tmp}/pk.key -generatedCsr ${tmp}/csr.pem -pem`);
    const csrPem = fs.readFileSync(`${tmp}/csr.pem`, 'utf-8');
    const b64 = csrPem.replace(/-----[^-]+-----/g, '').replace(/[\r\n\s]/g, '');

    console.log('--- Testing ULTIMATE PRE- SIMULATION ---');
    console.log('[Simulation Portal] ', (await doFetch('gw-fatoora.zatca.gov.sa', '/e-invoicing/simulation/compliance', b64, otp)).body.slice(0, 150));
}
run();
