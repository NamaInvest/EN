const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    const bashScript = `
node -e "
const fs = require('fs');
const { execSync } = require('child_process');

async function testAll() {
    try {
        const tmpDir = '/tmp/debug_zatca_888';
        try { execSync(\\`mkdir -p \\$\\{tmpDir\\}\\`); } catch(e){}

        // Perfect, strict ZATCA CSR Profile
        // We use the EXACT VAT Number from the DB Settings so length matches!
        const strictConfig = \`csr.common.name=TST-311985620700003-311985620700003
csr.serial.number=1-NAMAMEDICAL|2-EGS|3-12345678-1234-1234-1234-123456789012
csr.organization.identifier=311985620700003
csr.organization.unit.name=HeadOffice
csr.organization.name=NamaMedical
csr.country.name=SA
csr.invoice.type=1100
csr.location.address=Riyadh
csr.industry.business.category=Medical\`;

        fs.writeFileSync(\\`\\$\\{tmpDir\\}/csr-config.properties\\`, strictConfig);
        execSync(\\`fatoora -csr -csrConfig \\$\\{tmpDir\\}/csr-config.properties -privateKey \\$\\{tmpDir\\}/pk.key -generatedCsr \\$\\{tmpDir\\}/csr.pem -pem\\`);

        const csrPem = fs.readFileSync(\\`\\$\\{tmpDir\\}/csr.pem\\`, 'utf-8');
        const csrBase64 = csrPem.replace(/-----[^-]+-----/g, '').replace(/[\\r\\n\\s]/g, '');

        console.log('--- PERFECT SYNTHETIC CSR GENERATED ---');
        console.log('CSR Length:', csrBase64.length);

        const otps = ['568884', '257401', '155757'];
        
        for (let otp of otps) {
            console.log('Testing OTP:', otp);
            const res = await fetch('https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal/compliance', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Accept-Version': 'V2',
                    'Accept-Language': 'en',
                    'OTP': otp,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ csr: csrBase64 })
            });
            const text = await res.text();
            console.log(\`HTTP \${res.status} | \${text}\`);
            if (res.status === 200) {
                console.log('SUCCESS!! THIS OTP WORKS WITH THE PERFECT CSR!');
            }
        }

    } catch(e) { console.log('ERROR:', e.message); }
}
testAll();
"
`;
    conn.exec(`cd /www/wwwroot/n2.namainvist.com && ${bashScript}`, (err, stream) => {
        if (err) throw err;
        let output = '';
        stream.on('close', () => {
            console.log(output);
            conn.end();
        }).on('data', data => output += data.toString());
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD'});
