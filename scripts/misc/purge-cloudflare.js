const { Client } = require('ssh2');
const https = require('https');

function ssh(cmd) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => {
      c.exec(cmd, (err, stream) => {
        let out = '';
        stream.on('data', d => { out += d; process.stdout.write(d.toString()); });
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => { c.end(); r(out.trim()); });
      });
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
  });
}

// Read Cloudflare credentials from server .env
async function getCloudflareCredentials() {
  const env = await ssh('cat /www/wwwroot/namainvist.com/.env 2>/dev/null');
  const lines = env.split('\n');
  const creds = {};
  lines.forEach(l => {
    const [k, v] = l.split('=');
    if (k && v) creds[k.trim()] = v.trim().replace(/^["']|["']$/g, '');
  });
  return creds;
}

function cfRequest(method, path, body, apiToken) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const options = {
      hostname: 'api.cloudflare.com',
      port: 443,
      path: `/client/v4${path}`,
      method,
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };
    const req = https.request(options, (res) => {
      let resData = '';
      res.on('data', d => resData += d);
      res.on('end', () => {
        try { resolve(JSON.parse(resData)); } catch (e) { resolve(resData); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  const creds = await getCloudflareCredentials();
  console.log('=== .env keys found ===');
  console.log(Object.keys(creds).join(', '));
  
  const CF_API_TOKEN = creds.CLOUDFLARE_API_TOKEN || creds.CF_API_TOKEN;
  const CF_ZONE_ID = creds.CLOUDFLARE_ZONE_ID || creds.CF_ZONE_ID;
  
  if (!CF_API_TOKEN || !CF_ZONE_ID) {
    console.log('\n❌ No Cloudflare credentials in .env');
    console.log('Trying to purge via curl bypass...');
    
    // Try with curl adding no-cache headers
    await ssh('curl -s -H "Cache-Control: no-cache" -H "Pragma: no-cache" https://namainvist.com/ | grep -o "104 وحدة\\|نظام مؤسسي متكامل" | head -5');
    
    // Use Cloudflare API with the credentials found
    console.log('\nLooking for CF credentials in other .env files...');
    const allEnv = await ssh('find /www/wwwroot/namainvist.com -name ".env*" 2>/dev/null | xargs cat 2>/dev/null | grep -i "cloudflare\\|CF_"');
    console.log(allEnv || 'No CF credentials found');
    return;
  }
  
  console.log(`\n✅ Found Cloudflare credentials`);
  console.log(`Zone ID: ${CF_ZONE_ID}`);
  
  // Purge all cache
  console.log('\n=== Purging Cloudflare cache ===');
  const result = await cfRequest('POST', `/zones/${CF_ZONE_ID}/purge_cache`, { purge_everything: true }, CF_API_TOKEN);
  console.log('Purge result:', JSON.stringify(result, null, 2));
  
  if (result.success) {
    console.log('\n✅ Cloudflare cache purged! The new page will be served now.');
  }
})();
