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
    const otp = '123345'; 

    const configCore = `csr.common.name=${vat}
csr.serial.number=1-NAMA|2-HeadOffice|3-11223344-5566-7788-9900-aabbccddeeff
csr.organization.identifier=${vat}
csr.organization.unit.name=HeadOffice
csr.organization.name=Jalsa Indian Restaurant
csr.country.name=SA
csr.invoice.type=1100
csr.location.address=Najran
csr.industry.business.category=Restaurant`;

    const tmp = '/tmp/zatca_core_header_' + Date.now();
    execSync(`mkdir -p ${tmp}`);

    const { privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'secp256k1', publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' }});
    fs.writeFileSync(`${tmp}/pk.key`, privateKey);
    fs.writeFileSync(`${tmp}/c.properties`, configCore);
    
    execSync(`fatoora -csr -csrConfig ${tmp}/c.properties -privateKey ${tmp}/pk.key -generatedCsr ${tmp}/csr.pem -pem`);
    const csrPem = fs.readFileSync(`${tmp}/csr.pem`, 'utf-8');
    
    // Test 1: Full PEM string directly (WITH HEADERS AND NEWLINES)
    const b64_with_headers = csrPem;
    
    // Test 2: Standard Base64 but encoded properly as base64 of the base64? No.
    // Wait, base64 of the DER file?
    // Fatoora tool generates BOTH csr.pem AND csr (which is the binary DER format?? No, generatedCsr produces the file specified).
    
    console.log('--- Testing CORE PRODUCTION (WITH HEADERS) ---');
    console.log('[Core Portal Full PEM] ', (await doFetch('gw-fatoora.zatca.gov.sa', '/e-invoicing/core/compliance', b64_with_headers, otp)).body.slice(0, 300));
    
    // Also test SIMULATION FULL PEM
    console.log('--- Testing SIMULATION WITH HEADERS (PRE- prefixed) ---');
    const configSim = Object.assign({}, configCore);
    const configSimString = configCore.replace(`csr.common.name=${vat}`, `csr.common.name=PRE-${vat}`);
    fs.writeFileSync(`${tmp}/c_sim.properties`, configSimString);
    execSync(`fatoora -csr -csrConfig ${tmp}/c_sim.properties -privateKey ${tmp}/pk.key -generatedCsr ${tmp}/csr_sim.pem -pem`);
    const csrSimPem = fs.readFileSync(`${tmp}/csr_sim.pem`, 'utf-8');
    
    console.log('[Simulation Portal Full PEM] ', (await doFetch('gw-fatoora.zatca.gov.sa', '/e-invoicing/simulation/compliance', csrSimPem, otp)).body.slice(0, 300));
}
run();
