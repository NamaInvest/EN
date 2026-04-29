const { Client } = require('ssh2');

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

function writeFile(remotePath, content) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => {
      c.sftp((err, sftp) => {
        if (err) { c.end(); return r(false); }
        const ws = sftp.createWriteStream(remotePath, { flags: 'w', encoding: null, mode: 0o644 });
        ws.on('close', () => { console.log('[✓]', remotePath); c.end(); r(true); });
        ws.on('error', e => { console.error('[✗]', e.message); c.end(); r(false); });
        ws.end(Buffer.from(content, 'utf8'));
      });
    }).on('error', e => { console.error(e.message); r(false); })
      .connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
  });
}

// The real fix:
// 1. proxy_hide_header removes the s-maxage from Next.js 
// 2. add_header sets no-store so Cloudflare won't cache it
const etcNginxConf = `server {
    listen 80;
    listen 443 ssl http2;
    server_name namainvist.com www.namainvist.com;

    ssl_certificate /etc/ssl/namainvist/origin.crt;
    ssl_certificate_key /etc/ssl/namainvist/origin.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location /onboarding {
        proxy_pass http://localhost:2999;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_hide_header Cache-Control;
        add_header Cache-Control "no-store, no-cache, must-revalidate, max-age=0" always;
        add_header CDN-Cache-Control "no-store" always;
        add_header Cloudflare-CDN-Cache-Control "no-store" always;
    }

    location / {
        proxy_pass http://localhost:2999;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        # Remove the s-maxage header that Next.js sends (causes Cloudflare to cache forever)
        proxy_hide_header Cache-Control;
        proxy_hide_header X-Nextjs-Cache;
        proxy_hide_header X-Nextjs-Prerender;
        # Tell Cloudflare NOT to cache this
        add_header Cache-Control "no-store, no-cache, must-revalidate, max-age=0" always;
        add_header CDN-Cache-Control "no-store" always;
        add_header Cloudflare-CDN-Cache-Control "no-store" always;
        add_header Pragma "no-cache" always;
    }
}
`;

// Also update aaPanel proxy config
const aaPanelProxyConf = `location / {
    proxy_pass http://127.0.0.1:2999;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_hide_header Cache-Control;
    proxy_hide_header X-Nextjs-Cache;
    proxy_hide_header X-Nextjs-Prerender;
    add_header Cache-Control "no-store, no-cache, must-revalidate, max-age=0" always;
    add_header CDN-Cache-Control "no-store" always;
    add_header Cloudflare-CDN-Cache-Control "no-store" always;
}
`;

(async () => {
  console.log('=== Updating /etc/nginx/sites-available/namainvist.com ===');
  await writeFile('/etc/nginx/sites-available/namainvist.com', etcNginxConf);
  
  console.log('\n=== Updating aaPanel proxy config ===');
  await writeFile('/www/server/panel/vhost/nginx/proxy/namainvist.com/proxy.conf', aaPanelProxyConf);

  console.log('\n=== Test nginx ===');
  await ssh('nginx -t 2>&1');

  console.log('\n=== Reload nginx ===');
  await ssh('nginx -s reload 2>&1 && echo "✅ nginx reloaded"');

  // Wait then check headers
  await new Promise(r => setTimeout(r, 2000));

  console.log('\n=== Verify headers (s-maxage should be GONE) ===');
  await ssh('curl -sI https://namainvist.com/ 2>/dev/null | grep -iE "cache-control|x-nextjs|cf-cache|x-cache"');
})();
