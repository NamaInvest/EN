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
}
`;

(async () => {
  // Check the full nginx config for namainvist.com
  console.log('=== Full nginx config ===');
  await ssh('cat /www/server/panel/vhost/nginx/namainvist.com.conf 2>/dev/null || cat /etc/nginx/sites-enabled/namainvist.com 2>/dev/null');
  
  // Create proxy config directory if needed
  await ssh('mkdir -p /www/server/panel/vhost/nginx/proxy/namainvist.com/');
  
  // Write proxy config
  console.log('\n=== Writing proxy config ===');
  await writeFile('/www/server/panel/vhost/nginx/proxy/namainvist.com/proxy.conf', proxyConf);
  
  // Test nginx config
  console.log('\n=== Testing nginx ===');
  await ssh('nginx -t 2>&1');
  
  // Reload nginx
  console.log('\n=== Reloading nginx ===');
  await ssh('nginx -s reload 2>&1 && echo "nginx reloaded"');
  
  // Wait 2 seconds then test
  await new Promise(r => setTimeout(r, 2000));
  
  // Test via curl
  console.log('\n=== Testing response ===');
  await ssh('curl -s https://namainvist.com/ 2>/dev/null | grep -o "104 وحدة\\|73 قسم\\|نظام مؤسسي" | head -5');
})();
