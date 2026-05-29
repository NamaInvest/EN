const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    const bashScript = `
node -e "
const { execSync } = require('child_process');
const fs = require('fs');

async function testZatcaAPI() {
    try {
        const tmpDir = '/tmp/zatca_pure_test_123';
        execSync(\\`mkdir -p \\$\\{tmpDir\\}\\`);
        
        // STATIC PURE ENGLISH CSR
        const csrConfig = \`csr.common.name=TST-300000000000003
csr.serial.number=1-NAMA|2-BRANCH|3-12345678-1234-1234-1234-123456789012
csr.organization.identifier=300000000000003
csr.organization.unit.name=BRANCH
csr.organization.name=NAMA
csr.country.name=SA
csr.invoice.type=1100
csr.location.address=RRRD2929
csr.industry.business.category=Medical\`;

        fs.writeFileSync(\\`\\$\\{tmpDir\\}/csr-config.properties\\`, csrConfig);
        
        // Generate CSR
        console.log('Generating CSR from pure config...');
        execSync(\\`fatoora -csr -csrConfig \\$\\{tmpDir\\}/csr-config.properties -privateKey \\$\\{tmpDir\\}/private.key -generatedCsr \\$\\{tmpDir\\}/csr.pem -pem\\`);
        
        const csrPem = fs.readFileSync(\\`\\$\\{tmpDir\\}/csr.pem\\`, 'utf-8');
        const csrBase64 = csrPem.replace(/-----[^-]+-----/g, '').replace(/[\\r\\n\\s]/g, '');
        
        console.log('CSR Base64 extracted. Throwing synthetic payload to ZATCA...');
        
        // Fetch
        const res = await fetch('https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal/compliance', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Accept-Version': 'V2',
                'Accept-Language': 'en',
                'OTP': '123456', // Expected to fail with 'Invalid OTP' if CSR is perfect. If CSR is bad, fails with 'Invalid Request'
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ csr: csrBase64 })
        });
        
        const txt = await res.text();
        console.log('ZATCA HTTP STATUS:', res.status);
        console.log('ZATCA ERROR STRING:', txt);
        
        execSync(\\`rm -rf \\$\\{tmpDir\\}\\`);
    } catch(e) { console.error('FATAL TEST ERROR:', e.message); }
}
testZatcaAPI();
"
`;
    conn.exec(bashScript, (err, stream) => {
        if (err) throw err;
        let output = '';
        stream.on('close', () => {
            console.log(output);
            conn.end();
        }).on('data', data => output += data.toString());
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD'});
