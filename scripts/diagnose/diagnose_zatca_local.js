const cp = require('child_process');
const fs = require('fs');
const crypto = require('crypto');
const https = require('https');

const uuid = crypto.randomUUID();
const crn = '1010010000';
const taxNum = '300000000000003';
const cnName = `TST-${crn}-${taxNum}`;
const serialNumber = `1-NamaMedical|2-HeadOffice|3-${uuid}`;

const opensslConf = `[req]
default_bits = 2048
prompt = no
default_md = sha256
req_extensions = v3_req
distinguished_name = dn

[dn]
CN = ${cnName}
C = SA
O = NamaMedical
OU = HeadOffice

[v3_req]
basicConstraints = CA:FALSE
keyUsage = digitalSignature, nonRepudiation
1.3.6.1.4.1.311.20.2 = ASN1:UTF8String:ZATCA-Code-Signing
subjectAltName = dirName:alt_names

[alt_names]
SN = ${serialNumber}
UID = ${taxNum}
title = 1100
registeredAddress = RRRD2929
businessCategory = Medical
`;

const tmp = 'zatca_tmp_local';
if (!fs.existsSync(tmp)) fs.mkdirSync(tmp);

fs.writeFileSync(`${tmp}/zatca.cnf`, opensslConf);

try {
    cp.execSync(`openssl ecparam -name secp256k1 -genkey -noout -out ${tmp}/private.key`);
    cp.execSync(`openssl req -new -key ${tmp}/private.key -out ${tmp}/csr.pem -config ${tmp}/zatca.cnf -extensions v3_req`);
    
    const csrPem = fs.readFileSync(`${tmp}/csr.pem`, 'utf8');
    // Notice we use the CORRECT replace here: [\r\n\s]
    const csrBase64 = csrPem.replace(/-----[^-]+-----/g, '').replace(/[\r\n\s]/g, '');
    
    console.log('Generated Valid Local CSR!');
    console.log('CSR Snippet:', csrBase64.substring(0, 50));
    
    const payload = JSON.stringify({csr: csrBase64});
    
    console.log('Sending to ZATCA Sandbox /compliance endpoint with OTP 586277...');
    
    const req = https.request({
        hostname: 'gw-fatoora.zatca.gov.sa',
        path: '/e-invoicing/developer-portal/compliance',
        method: 'POST',
        headers: {
            'OTP': '586277',
            'Accept-Version': 'V2',
            'Accept-Language': 'en',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
        }
    }, res => {
        let b = '';
        res.on('data', d => b += d);
        res.on('end', () => console.log('ZATCA RESPONSE => STATUS:', res.statusCode, 'BODY:', b));
    });
    
    req.on('error', e => console.error('Request Error:', e));
    req.write(payload);
    req.end();
} catch (e) {
    console.error('OpenSSL or Execution Error:', e);
}
