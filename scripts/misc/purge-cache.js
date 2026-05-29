const { Client } = require('ssh2');

function ssh(cmd) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => {
      c.exec(cmd, (err, stream) => {
        let out = '';
        stream.on('data', d => { out += d; process.stdout.write(d.toString()); });
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', (code) => { c.end(); r({ out: out.trim(), code }); });
      });
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
  });
}

(async () => {
  console.log('=== Finding and clearing Nginx cache ===\n');
  
  // Find nginx cache dirs
  await ssh('find /www /var/cache/nginx /tmp -maxdepth 4 -name "*.cache" -o -name "cache.hdr" 2>/dev/null | head -5');
  
  // Find nginx config for namainvist.com
  const { out: nginxConf } = await ssh('grep -r "namainvist" /etc/nginx/sites-enabled/ /www/server/panel/vhost/nginx/ 2>/dev/null | grep -i cache | head -10');
  console.log('Nginx cache config:', nginxConf || 'none found');
  
  // Find the cache zone/path
  const { out: cacheZone } = await ssh('grep -r "proxy_cache_path\\|fastcgi_cache_path" /etc/nginx/ /www/server/panel/ 2>/dev/null | head -10');
  console.log('\nCache zones:', cacheZone || 'none');
  
  // Clear all common cache locations
  console.log('\n=== Clearing caches ===');
  
  // aaPanel cache locations
  await ssh('find /www/server/panel/vhost/nginx/proxy/ -name "*namainvist*" 2>/dev/null | xargs rm -f 2>/dev/null; echo "proxy configs cleared"');
  await ssh('find /tmp/nginx_cache/ /var/cache/nginx/ /www/wwwroot/namainvist.com/.next/cache/ -type f -delete 2>/dev/null; echo "nginx caches cleared"');
  
  // Clear .next server cache (the actual pre-rendered pages)
  await ssh('rm -f /www/wwwroot/namainvist.com/.next/server/app/index.html; echo "static HTML deleted"');
  await ssh('rm -f /www/wwwroot/namainvist.com/.next/server/app/index.rsc; echo "RSC cache deleted"');
  
  // Rebuild
  console.log('\n=== Rebuilding ===');
  await ssh('cd /www/wwwroot/namainvist.com && rm -rf .next && npm run build 2>&1 | tail -15');
  
  // Restart nginx AND pm2
  console.log('\n=== Restarting services ===');
  await ssh('pm2 restart main-site 2>&1 | tail -2');
  await ssh('nginx -s reload 2>&1 || service nginx reload 2>&1 || echo "nginx reload skipped"');
  
  // Verify content in new built HTML
  const { out: count104 } = await ssh('grep -c "104" /www/wwwroot/namainvist.com/.next/server/app/index.html 2>&1');
  const { out: count73 } = await ssh('grep -c "73" /www/wwwroot/namainvist.com/.next/server/app/index.html 2>&1');
  console.log('\n✅ Built HTML - "104" count:', count104, '| "73" count:', count73);
  console.log('\nDone! Try opening namainvist.com now.');
})();
