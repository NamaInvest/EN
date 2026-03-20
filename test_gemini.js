const https = require('https');

const payload = JSON.stringify({
  contents: [{
      parts: [
          { text: "Extract text from this image" },
          { inline_data: { mime_type: "image/jpeg", data: "fakebase64string=" } }
      ]
  }]
});

const req = https.request('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=FAKE_KEY', {
  method: 'POST',
  headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Body:', data);
  });
});

req.on('error', console.error);
req.write(payload);
req.end();
