const https = require('https');

https.get('https://n11.namainvist.com/api/test-translation', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log('RESPONSE:', res.statusCode, data));
}).on('error', (err) => console.log('ERROR:', err));
