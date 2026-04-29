const fs = require('fs');
const https = require('https');
const { execSync } = require('child_process');

function doFetch(csrBase64, otp) {
    return new Promise((resolve) => {
        const postData = JSON.stringify({ csr: csrBase64 });
        const options = {
            hostname: 'gw-fatoora.zatca.gov.sa', port: 443,
            path: '/e-invoicing/simulation/compliance', method: 'POST',
            headers: {
                'Accept': 'application/json', 'Accept-Version': 'V2', 'Accept-Language': 'en',
                'OTP': otp, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData)
            }
        };
        const req = https.request(options, (res) => {
            let data = ''; res.on('data', c => data+=c); res.on('end', () => resolve({status: res.statusCode, body: data}));
        });
        req.on('error', e => resolve({status: 500, body: e.message}));
        req.write(postData); req.end();
    });
}

async function run() {
    const vat = '311985620700003';
    const otp = '252740';
    const prefixes = [
        {name: 'SIM- PRE-311', cn: `PRE-${vat}`},
        {name: 'SIM- VAT', cn: vat},
        {name: 'SIM- PRE-VAT-VAT', cn: `PRE-${vat}-${vat}`},
        {name: 'SIM- VAT-VAT', cn: `${vat}-${vat}`},
        {name: 'SIM- TST-311', cn: `TST-${vat}`},
        {name: 'CORE- VAT', cn: vat, isCore: true}
    ];

    for (let p of prefixes) {
        const tmpDir = '/tmp/zatca_exhaustive_' + Date.now() + Math.floor(Math.random()*1000);
        execSync(`mkdir -p ${tmpDir}`);
        const configData = `csr.common.name=${p.cn}
csr.serial.number=1-NAMA|2-HeadOffice|3-11223344-5566-7788-9900-aabbccddeeff
csr.organization.identifier=${vat}
csr.organization.unit.name=HeadOffice
csr.organization.name=Jalsa Indian Restaurant
csr.country.name=SA
csr.invoice.type=1100
csr.location.address=Najran
csr.industry.business.category=Restaurant`;

        fs.writeFileSync(`${tmpDir}/c.properties`, configData);
        execSync(`fatoora -csr -csrConfig ${tmpDir}/c.properties -privateKey ${tmpDir}/pk.key -generatedCsr ${tmpDir}/csr.pem -pem`);
        
        const csrPem = fs.readFileSync(`${tmpDir}/csr.pem`, 'utf-8');
        const b64 = csrPem.replace(/-----[^-]+-----/g, '').replace(/[\r\n\s]/g, '');

        if(p.isCore) {
            // Post to core
            const postData = JSON.stringify({ csr: b64 });
            const options = {
                hostname: 'gw-fatoora.zatca.gov.sa', port: 443,
                path: '/e-invoicing/core/compliance', method: 'POST',
                headers: {
                    'Accept': 'application/json', 'Accept-Version': 'V2', 'Accept-Language': 'en',
                    'OTP': otp, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData)
                }
            };
            const req = https.request(options, (res) => {
                let data = ''; res.on('data', c => data+=c); 
                res.on('end', () => console.log(`[${p.name}] HTTP ${res.statusCode} | > `, data.substring(0, 200)));
            });
            req.write(postData); req.end();
            await new Promise(r => setTimeout(r, 1000));
        } else {
            const resp = await doFetch(b64, otp);
            console.log(`[${p.name}] HTTP ${resp.status} | > `, resp.body.substring(0, 200));
        }
    }
}
run();
