const fs = require('fs');
const { execSync } = require('child_process');

async function run() {
    const vat = '311985620700003';
    // Let's use the most universally accepted Simulation CSR format
    const configData = `csr.common.name=PRE-${vat}
csr.serial.number=1-NAMA|2-HeadOffice|3-11223344-5566-7788-9900-aabbccddeeff
csr.organization.identifier=${vat}
csr.organization.unit.name=HeadOffice
csr.organization.name=Jalsa Indian Restaurant
csr.country.name=SA
csr.invoice.type=1100
csr.location.address=Najran
csr.industry.business.category=Restaurant`;

    const tmpDir = '/tmp/zatca_perf_test_' + Date.now();
    try { execSync(`mkdir -p ${tmpDir}`); } catch(e){}

    fs.writeFileSync(`${tmpDir}/csr-config.properties`, configData);
    
    console.log('--- GENERATING CSR WITH CONFIG ---');
    console.log(configData);
    
    try {
        execSync(`fatoora -csr -csrConfig ${tmpDir}/csr-config.properties -privateKey ${tmpDir}/pk.key -generatedCsr ${tmpDir}/csr.pem -pem`);
    } catch(e) {
        console.log('CSR Gen Failed'); return;
    }

    const csrPem = fs.readFileSync(`${tmpDir}/csr.pem`, 'utf-8');
    const csrBase64 = csrPem.replace(/-----[^-]+-----/g, '').replace(/[\r\n\s]/g, '');
    
    const otp = '252740';
    console.log('\\n--- PINGING SIMULATION PORTAL ---');
    const res = await fetch('https://gw-fatoora.zatca.gov.sa/e-invoicing/simulation/compliance', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Accept-Version': 'V2', 'Accept-Language': 'en', 'OTP': otp, 'Content-Type': 'application/json' },
        body: JSON.stringify({ csr: csrBase64 })
    });
    
    const txt = await res.text();
    console.log('HTTP:', res.status);
    console.log('Response:', txt);
    
    if(txt.includes('Invalid-CSR')) {
        console.log('\\n⚠️ TRYING VAT ONLY INSTEAD OF PRE- ...');
        const configVAT = configData.replace(`PRE-${vat}`, vat);
        fs.writeFileSync(`${tmpDir}/csr-config2.properties`, configVAT);
        execSync(`fatoora -csr -csrConfig ${tmpDir}/csr-config2.properties -privateKey ${tmpDir}/pk2.key -generatedCsr ${tmpDir}/csr2.pem -pem`);
        const csr2Pem = fs.readFileSync(`${tmpDir}/csr2.pem`, 'utf-8');
        const b64 = csr2Pem.replace(/-----[^-]+-----/g, '').replace(/[\r\n\s]/g, '');
        
        const r2 = await fetch('https://gw-fatoora.zatca.gov.sa/e-invoicing/simulation/compliance', {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Accept-Version': 'V2', 'Accept-Language': 'en', 'OTP': otp, 'Content-Type': 'application/json' },
            body: JSON.stringify({ csr: b64 })
        });
        console.log('HTTP(VAT):', r2.status);
        console.log('Response(VAT):', await r2.text());
    }
}
run();
