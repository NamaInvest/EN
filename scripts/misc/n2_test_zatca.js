const fs = require('fs');
const { execSync } = require('child_process');

async function testZatca() {
    console.log('--- START ZATCA TEST ---');
    
    const vat = '311985620700003';
    const otp = '252740'; // Will fail with 400 Invalid-OTP if expired, BUT NOT Invalid-CSR!
    
    // We strictly use PRE- for Simulation according to our tests
    const strictConfig = `csr.common.name=PRE-\${vat}
csr.serial.number=1-NAMA|2-HeadOffice|3-11223344-5566-7788-9900-aabbccddeeff
csr.organization.identifier=\${vat}
csr.organization.unit.name=HeadOffice
csr.organization.name=Jalsa Indian Restaurant
csr.country.name=SA
csr.invoice.type=1100
csr.location.address=Najran
csr.industry.business.category=Restaurant`;

    fs.writeFileSync('/tmp/test-csr.properties', strictConfig);
    console.log('Config Written.');
    
    // Generate Java CSR
    try {
        execSync('fatoora -csr -csrConfig /tmp/test-csr.properties -privateKey /tmp/pk.key -generatedCsr /tmp/csr.pem -pem');
        console.log('Java CSR Module Executed.');
    } catch (e) {
        console.log('Fatoora Error:', e.message);
        return;
    }
    
    const csrPem = fs.readFileSync('/tmp/csr.pem', 'utf-8');
    const csrBase64 = csrPem.replace(/-----[^-]+-----/g, '').replace(/[\r\n\s]/g, '');
    console.log('Clean Base64 CSR Length:', csrBase64.length);
    console.log('Base64 Sample:', csrBase64.substring(0, 20) + '...');
    
    console.log('Sending to ZATCA Simulation...');
    
    try {
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
        
        const txt = await res.text();
        console.log('HTTP', res.status);
        console.log('RESPONSE:', txt);
        
    } catch(err) {
        console.log('Fetch crash:', err.message);
    }
}
testZatca();
