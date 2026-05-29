const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
    console.log('--- DEPLOYING STANDALONE ZATCA COMPLIANCE CSID TEST SCRIPT TO N2 ---');
    const standaloneScript = `
const fs = require('fs');
const { execSync } = require('child_process');

async function run() {
    try {
        const tmpDir = '/tmp/debug_zatca_final_3';
        try { execSync('mkdir -p ' + tmpDir); } catch(e){}

        const strictConfig = "csr.common.name=TST-311985620700003-311985620700003\\ncsr.serial.number=1-NAMA|2-EGS|3-128a3910-1234-1234-1234-123456789012\\ncsr.organization.identifier=311985620700003\\ncsr.organization.unit.name=HeadOffice\\ncsr.organization.name=NAMA\\ncsr.country.name=SA\\ncsr.invoice.type=1100\\ncsr.location.address=Riyadh\\ncsr.industry.business.category=Medical";

        fs.writeFileSync(tmpDir + '/csr-config.properties', strictConfig);
        
        console.log('Generating CSR via Java ZATCA SDK 4.0.0...');
        let fatooraOutput = '';
        try {
            fatooraOutput = execSync('fatoora -csr -csrConfig ' + tmpDir + '/csr-config.properties -privateKey ' + tmpDir + '/pk.key -generatedCsr ' + tmpDir + '/csr.pem -pem').toString();
        } catch (execErr) {
            console.error('FATAL SDK ERROR:', execErr.stdout ? execErr.stdout.toString() : '', execErr.message);
            return;
        }

        const csrPem = fs.readFileSync(tmpDir + '/csr.pem', 'utf-8');
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
            console.log('HTTP ' + res.status + ' | ZATCA Sandbox Gateway Response:\\n' + text);
            
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
`;
    
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const s = sftp.createWriteStream('/tmp/run_zatca_validation.js');
        s.write(standaloneScript);
        s.end();
        s.on('close', () => {
            conn.exec('node /tmp/run_zatca_validation.js', (err, stream) => {
                if (err) throw err;
                stream.on('close', () => conn.end()).on('data', d => process.stdout.write(d.toString()));
            });
        });
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD'});
