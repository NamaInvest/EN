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
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
  });
}

function writeFile(remotePath, content) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => {
      c.sftp((err, sftp) => {
        if (err) { c.end(); return r(false); }
        const ws = sftp.createWriteStream(remotePath, { flags: 'w', encoding: null, mode: 0o644 });
        ws.on('close', () => { c.end(); r(true); });
        ws.on('error', e => { console.error(e.message); c.end(); r(false); });
        ws.end(Buffer.from(content, 'utf8'));
      });
    }).on('error', e => { console.error(e.message); r(false); })
      .connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
  });
}

// Update nginx proxy config to add Cache-Control: no-store header
// This tells Cloudflare NOT to cache the homepage
const proxyConf = `location / {
    proxy_pass http://127.0.0.1:2999;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;
    # Disable Cloudflare caching for dynamic pages
    add_header Cache-Control "no-store, no-cache, must-revalidate, max-age=0";
    add_header CDN-Cache-Control "no-store";
    add_header Cloudflare-CDN-Cache-Control "no-store";
}
`;

// Also update /etc/nginx/sites-available/namainvist.com to add no-cache
(async () => {
  console.log('=== Read /etc/nginx/sites-available/namainvist.com ===');
  const currentConf = await ssh('cat /etc/nginx/sites-available/namainvist.com 2>/dev/null');
  console.log(currentConf.substring(0, 500));
  
  // Update aaPanel proxy config with no-cache headers
  console.log('\n=== Updating aaPanel proxy config ===');
  await writeFile('/www/server/panel/vhost/nginx/proxy/namainvist.com/proxy.conf', proxyConf);
  
  // Also update /etc/nginx/sites-available/namainvist.com if it exists
  if (currentConf && currentConf.includes('proxy_pass')) {
    const newConf = currentConf.replace(
      /location \/ \{[\s\S]*?proxy_pass http:\/\/localhost:2999;[\s\S]*?\}/,
      `location / {
    proxy_pass http://localhost:2999;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    add_header Cache-Control "no-store, no-cache, must-revalidate, max-age=0" always;
    add_header CDN-Cache-Control "no-store" always;
    add_header Cloudflare-CDN-Cache-Control "no-store" always;
}`
    );
    await writeFile('/etc/nginx/sites-available/namainvist.com', newConf);
    console.log('[✓] /etc/nginx/sites-available/namainvist.com updated');
  }
  
  // Test and reload nginx
  console.log('\n=== Test & reload nginx ===');
  await ssh('nginx -t 2>&1 && nginx -s reload 2>&1 && echo "nginx reloaded OK"');
  
  // Wait 2 seconds then test
  await new Promise(r => setTimeout(r, 2000));
  
  // Verify - curl should NOT show x-cache: HIT anymore
  console.log('\n=== Curl headers (should show no-store) ===');
  await ssh('curl -sI https://namainvist.com/ 2>/dev/null | grep -E "cache-control|x-cache|cf-cache" | head -5');
  
  console.log('\n✅ Done! Now try refreshing namainvist.com in the browser');
})();
