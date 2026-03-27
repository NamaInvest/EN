const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    const remoteScript = `
const fs = require('fs');
const { execSync } = require('child_process');

async function run() {
    try {
        const EGS_Name = 'NAMA';
        const uuid = '11223344-5566-7788-9900-aabbccddeeff';
        const vat = '311985620700003';
        
        const variations = [
            { name: 'VAT ONLY (Production Standard)', cn: vat },
            { name: 'PRE- PREFIX (Simulation Standard)', cn: 'PRE-' + vat },
            { name: 'TST- PREFIX (Developer Standard)', cn: 'TST-' + vat }
        ];

        const otp = '252740';

        for (let v of variations) {
            console.log('\\n-----------------------------------------');
            console.log('Testing Variation:', v.name);
            console.log('Common Name:', v.cn);

            const tmpDir = '/tmp/debug_zatca_var_' + Date.now();
            try { execSync('mkdir -p ' + tmpDir); } catch(e){}

            const config = "csr.common.name=" + v.cn + "\\ncsr.serial.number=1-" + EGS_Name + "|2-HeadOffice|3-" + uuid + "\\ncsr.organization.identifier=" + vat + "\\ncsr.organization.unit.name=HeadOffice\\ncsr.organization.name=Jalsa Indian Restaurant\\ncsr.country.name=SA\\ncsr.invoice.type=1100\\ncsr.location.address=najran\\ncsr.industry.business.category=Restaurant";

            fs.writeFileSync(tmpDir + '/csr-config.properties', config);
            
            try {
                execSync('fatoora -csr -csrConfig ' + tmpDir + '/csr-config.properties -privateKey ' + tmpDir + '/pk.key -generatedCsr ' + tmpDir + '/csr.pem -pem > /dev/null 2>&1');
            } catch (err) {
                console.log('❌ Java SDK build failed for this config.');
                continue;
            }

            const csrPem = fs.readFileSync(tmpDir + '/csr.pem', 'utf-8');
            const csrBase64 = csrPem.replace(/-----[^-]+-----/g, '').replace(/[\\r\\n\\s]/g, '');

            const res = await fetch('https://gw-fatoora.zatca.gov.sa/e-invoicing/simulation/compliance', {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'Accept-Version': 'V2', 'Accept-Language': 'en', 'OTP': otp, 'Content-Type': 'application/json' },
                body: JSON.stringify({ csr: csrBase64 })
            });

            const text = await res.text();
            console.log('Result HTTP ' + res.status + ':', text);
        }
    } catch(e) { console.log('SCRIPT KILLED:', e.message); }
}
run();
`;
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const s = sftp.createWriteStream('/tmp/run_tests.js');
        s.write(remoteScript);
        s.end();
        s.on('close', () => {
            conn.exec('node /tmp/run_tests.js', (errExec, stream) => {
                if (errExec) throw errExec;
                stream.on('close', () => conn.end())
                      .on('data', d => process.stdout.write(d.toString()));
            });
        });
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
