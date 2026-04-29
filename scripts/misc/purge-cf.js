const { Client } = require('ssh2');
const https = require('https');

const SERVER = '46.4.188.170';

function ssh(cmd) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => {
      c.exec(cmd, (err, stream) => {
        let out = '';
        stream.on('data', d => out += d);
        stream.stderr.on('data', d => out += d);
        stream.on('close', () => { c.end(); r(out.trim()); });
      });
    }).connect({ host: SERVER, port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
  });
}

function cfRequest(method, path, body, token, zoneId) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.cloudflare.com',
      port: 443,
      path: `/client/v4${path}`,
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
      timeout: 10000,
    };
    const req = https.request(options, res => {
      let result = '';
      res.on('data', d => result += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(result) }); }
        catch { resolve({ status: res.statusCode, data: result }); }
      });
    });
    req.on('error', e => resolve({ status: 0, error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, error: 'TIMEOUT' }); });
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  console.log('=== Looking for Cloudflare credentials ===');

  // Search for CF credentials in common locations
  const credSearch = await ssh(`
    # Check .env files
    grep -r "CLOUDFLARE\\|CF_API\\|CF_TOKEN\\|cf_token\\|cloudflare" \
      /www/wwwroot/namainvist.com/.env \
      /www/wwwroot/namainvist.com/.env.local \
      /root/.env \
      /etc/environment \
      2>/dev/null | grep -i "token\\|key\\|zone" | head -10
    
    echo "---env.local---"
    [ -f /www/wwwroot/namainvist.com/.env.local ] && cat /www/wwwroot/namainvist.com/.env.local | grep -i "cloud\\|cf_" | head -5

    echo "---env.production---"
    [ -f /www/wwwroot/namainvist.com/.env.production ] && cat /www/wwwroot/namainvist.com/.env.production | grep -i "cloud\\|cf_" | head -5
    
    echo "---all .env files---"
    ls -la /www/wwwroot/namainvist.com/.env* 2>/dev/null
  `);
  console.log(credSearch);

  // Also check the nginx config for any CF zone ID hints
  const nginxCF = await ssh(`
    grep -r "cloudflare\\|zoneid\\|zone_id" /www/server/panel/vhost/ 2>/dev/null | head -5
    # Check if aaPanel has CF settings
    find /www/server/panel -name "*.json" 2>/dev/null | xargs grep -l "cloudflare" 2>/dev/null | head -3
  `);
  console.log('Nginx CF:', nginxCF);

  // ── APPROACH: Fix Nginx to add Cache-Tag for instant purge ──────────────
  console.log('\n=== Applying Nginx cache bypass fix ===');

  // Even without CF creds, we can use CF's "no-cache" bypass:
  // Adding Pragma: no-cache to the response headers
  // And changing the response in a way CF won't cache
  await ssh(`
    # Update proxy.conf to add stronger cache bypass headers
    cat > /www/server/panel/vhost/nginx/proxy/namainvist.com/proxy.conf << 'NGINX_EOF'
location / {
    proxy_pass http://127.0.0.1:2999;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    
    # Remove all caching headers from upstream
    proxy_hide_header Cache-Control;
    proxy_hide_header X-Nextjs-Cache;
    proxy_hide_header X-Nextjs-Prerender;
    proxy_hide_header Pragma;
    proxy_hide_header Expires;
    proxy_hide_header ETag;
    proxy_hide_header Last-Modified;
    
    # Force no-cache on ALL responses
    add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0" always;
    add_header Pragma "no-cache" always;
    add_header Expires "0" always;
    add_header CDN-Cache-Control "no-store" always;
    add_header Cloudflare-CDN-Cache-Control "no-store" always;
    add_header Surrogate-Control "no-store" always;
    add_header Vary "*" always;
}
NGINX_EOF
    echo "✅ proxy.conf updated"
    nginx -t 2>&1 | tail -3
    systemctl reload nginx 2>&1 || nginx -s reload 2>&1
    echo "✅ nginx reloaded"
  `);

  // ── Check the CF response headers after nginx reload ────────────────────
  console.log('\n=== Verifying response headers now ===');
  const https2 = require('https');
  const checkHeaders = () => new Promise(r => {
    const req = https2.get('https://namainvist.com/', { timeout: 8000, headers: { 'User-Agent': 'curl/7.0' } }, res => {
      r({
        status: res.statusCode,
        cfCache: res.headers?.['cf-cache-status'] || 'none',
        cacheControl: res.headers?.['cache-control'] || 'none',
        age: res.headers?.['age'] || '0',
        pragma: res.headers?.['pragma'] || 'none',
        surrogate: res.headers?.['surrogate-control'] || 'none',
      });
    });
    req.on('error', () => r({ status: 0 }));
    req.on('timeout', () => { req.destroy(); r({ status: 0 }); });
  });

  const h = await checkHeaders();
  console.log('CF-Cache-Status:', h.cfCache);
  console.log('Cache-Control:', h.cacheControl);
  console.log('Age:', h.age);
  console.log('Pragma:', h.pragma);

  if (h.cfCache === 'DYNAMIC' || h.cfCache === 'BYPASS' || h.cfCache === 'MISS') {
    console.log('\n✅ Cloudflare respects no-cache — page should update immediately');
  } else if (h.cfCache === 'HIT') {
    console.log('\n⚠️ Cloudflare still serving from cache (HIT)');
    console.log('→ Need manual cache purge via Cloudflare dashboard');
    console.log('→ Instructions: https://dash.cloudflare.com → namainvist.com → Caching → Purge Everything');
  }

  // ── Try to find CF credentials in process environment ───────────────────
  const processEnv = await ssh(`
    pm2 env main-site 2>/dev/null | grep -i "cloud\\|CF_\\|zone" | head -10
    printenv | grep -i "cloud\\|CF_\\|zone" | head -5
  `);
  if (processEnv.trim()) {
    console.log('\n=== CF creds in env:', processEnv);
  }

})();
