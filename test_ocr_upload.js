const fs = require('fs');
const http = require('http'); // n2.namainvist.com on port 3002 is local
const crypto = require('crypto');

// create a dummy 3MB file
const fakeImageBytes = crypto.randomBytes(3 * 1024 * 1024);
fs.writeFileSync('dummy3mb.jpg', fakeImageBytes);

const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
const head = Buffer.from(
  `--${boundary}\r\n` +
  `Content-Disposition: form-data; name="file"; filename="dummy3mb.jpg"\r\n` +
  `Content-Type: image/jpeg\r\n\r\n`
);
const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
const payload = Buffer.concat([head, fakeImageBytes, tail]);

const options = {
  hostname: '46.4.188.170',
  port: 3002, // Hitting the N2 service directly bypassing Cloudflare
  path: '/api/purchases/ocr',
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': payload.length
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let data = '';
  res.on('data', chunk => data += chunk.toString());
  res.on('end', () => console.log('RESPONSE:', data.substring(0, 500)));
});

req.on('error', (e) => console.error('REQUEST ERROR:', e));
req.write(payload);
req.end();
