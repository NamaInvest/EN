import crypto from 'crypto';

const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
});

const privDer = privateKey.export({ type: 'pkcs8', format: 'der' });
const privateKeyBase64 = privDer.toString('base64');

const pubDer = publicKey.export({ type: 'spki', format: 'der' });
const certificateBase64 = pubDer.toString('base64');

console.log('=== ZATCA ECDSA Keys (secp256r1) ===');
console.log('');
console.log('Private Key (Base64):');
console.log(privateKeyBase64);
console.log('');
console.log('Certificate/Public Key (Base64):');
console.log(certificateBase64);
