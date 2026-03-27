const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('--- TESTING ZATCA COMPLIANCE SIMULATION PRE- PREFIX ON N2 ---');
    const bashScript = `
node -e "
const fs = require('fs');
const { execSync } = require('child_process');

async function run() {
    try {
        const tmpDir = '/tmp/debug_zatca_pre_fix';
        try { execSync('mkdir -p ' + tmpDir); } catch(e){}

        const EGS_Name = 'JalsaIndianRest'.replace(/\\s+/g, '').substring(0, 15);
        const uuid = '11223344-5566-7788-9900-aabbccddeeff';

        const strictConfig = \`csr.common.name=PRE-311985620700003
csr.serial.number=1-\${EGS_Name}|2-HeadOffice|3-\${uuid}
csr.organization.identifier=311985620700003
csr.organization.unit.name=HeadOffice
csr.organization.name=Jalsa Indian Restaurant
csr.country.name=SA
csr.invoice.type=1100
csr.location.address=najran
csr.industry.business.category=Restaurant\`;

        fs.writeFileSync(tmpDir + '/csr-config.properties', strictConfig);
        
        console.log('Generating PRE- CSR via Java ZATCA SDK 4.0.0...');
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
        let success = false;
        
        for (let otp of otps) {
            console.log('\\n----------------------------------');
            console.log('Authenticating against ZATCA Simulation API using OTP:', otp);
            
            const res = await fetch('https://gw-fatoora.zatca.gov.sa/e-invoicing/simulation/compliance', {
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
                console.log('\\n✅✅✅✅ SUCCESS: THE ONBOARDING PROTOCOL PASSED!! ✅✅✅✅\\n');
                success = true;
                break;
            } else if (res.status === 400 && text.includes('Invalid Request')) {
                console.log('❌ Invalid Request - VAT-OTP mismatch.');
            } else if (res.status === 400 && text.includes('Invalid-CSR')) {
                console.log('❌ Invalid-CSR - The CSR logic is structurally rejected inside the PRE environment!');
            } else {
                console.log('⚠️ General HTTP Exception: ' + res.status);
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
