const https = require('https');

https.get('https://ahmedalyamicompany.namainvist.com/warehouses/options', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body length:', data.length);
    if (data.includes('وحدات التعبئة')) {
      console.log('✅ Found CLEAN Arabic text ("وحدات التعبئة")');
    }
    if (data.includes('\u0638\u02C6\u0637')) {
      console.log('❌ Found MOJIBAKE!');
    }
    
    // Let's also check a snippet
    const index = Math.max(0, data.indexOf('id="units"'));
    console.log('Snippet around units:', data.substring(index, index + 200));
  });
}).on('error', (e) => {
  console.error(e);
});
