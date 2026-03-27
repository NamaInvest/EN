const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('--- EXECUTING NATIVE ZATCA COMPLIANCE CSID TEST ON N2 ---');
    const bashScript = `
node -e "
const fs = require('fs');
const { execSync } = require('child_process');

async function run() {
    try {
        const tmpDir = '/tmp/debug_zatca_final_2';
        try { execSync(\\`mkdir -p \\$\\{tmpDir\\}\\`); } catch(e){}

        // The absolute purest English CSR structure matching DB VAT
        const strictConfig = \`csr.common.name=TST-311985620700003-311985620700003
csr.serial.number=1-NAMA|2-EGS|3-128a3910-1234-1234-1234-123456789012
csr.organization.identifier=311985620700003
csr.organization.unit.name=HeadOffice
csr.organization.name=NAMA
csr.country.name=SA
csr.invoice.type=1100
csr.location.address=Riyadh
csr.industry.business.category=Medical\`;

        fs.writeFileSync(\\`\\$\\{tmpDir\\}/csr-config.properties\\`, strictConfig);
        
        // Execute the now globally-patched fatoora bash CLI module
        console.log('Generating CSR via Java ZATCA SDK 4.0.0...');
        let fatooraOutput = '';
        try {
            fatooraOutput = execSync(\`fatoora -csr -csrConfig \${tmpDir}/csr-config.properties -privateKey \${tmpDir}/pk.key -generatedCsr \${tmpDir}/csr.pem -pem\`).toString();
        } catch (execErr) {
            console.error('FATAL SDK ERROR:', execErr.stdout ? execErr.stdout.toString() : '', execErr.message);
            return;
        }

        const csrPem = fs.readFileSync(\`\${tmpDir}/csr.pem\`, 'utf-8');
        const csrBase64 = csrPem.replace(/-----[^-]+-----/g, '').replace(/[\\r\\n\\s]/g, '');

        console.log('SUCCESS! PERFECT CLEAN BASE64 CSR GENERATED!');
        console.log('CSR Length:', csrBase64.length);

        const otps = ['252740', '667050'];
        
        for (let otp of otps) {
            console.log('\\n----------------------------------');
            console.log('Authenticating against ZATCA Fatoora Sandbox API using OTP:', otp);
            
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
            console.log(\`HTTP \${res.status} | ZATCA Sandbox Gateway Response:\\n\${text}\`);
            
            if (res.status === 200) {
                console.log('\\n✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅');
                console.log('SUCCESS: THE ONBOARDING PROTOCOL HAS PASSED!!');
                console.log('CSID PROVISIONED. THE SYSTEM IS NOW AUTHORIZED FOR PHASE 2!');
                console.log('✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅\\n');
                break;
            } else if (res.status === 400 && text.includes('Invalid Request')) {
                console.log('❌ Invalid Request - The Gateway forcefully rejected the payload or the VAT-OTP relationship.');
            } else {
                console.log('⚠️ General SDK error or Expired Token HTTP Exception.');
            }
        }

    } catch(e) { console.log('SCRIPT KILLED:', e.message); }
}
run();
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
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
