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

(async () => {
  console.log('=== Clearing Next.js server cache for / route ===');

  // Delete ONLY the cached HTML/RSC for root route (not the whole .next)
  await ssh('rm -f /www/wwwroot/namainvist.com/.next/server/app/index.html && echo "✓ index.html deleted"');
  await ssh('rm -f /www/wwwroot/namainvist.com/.next/server/app/index.rsc && echo "✓ index.rsc deleted"');
  await ssh('rm -f /www/wwwroot/namainvist.com/.next/server/app/index.meta && echo "✓ index.meta deleted"');
  await ssh('rm -rf /www/wwwroot/namainvist.com/.next/server/app/index.segments && echo "✓ segments deleted"');
  
  // Delete the full page cache
  await ssh('rm -rf /www/wwwroot/namainvist.com/.next/cache/fetch-cache/ 2>/dev/null && echo "✓ fetch-cache cleared"');
  
  // Restart PM2 to clear in-memory cache
  console.log('\n=== Restarting main-site ===');
  await ssh('pm2 restart main-site 2>&1 | tail -3');
  
  // Also restart nginx to clear any nginx-level cache
  await ssh('nginx -s reload 2>&1 && echo "✓ nginx reloaded"');
  
  // Wait for startup
  await new Promise(r => setTimeout(r, 4000));
  
  // Verify the page headers
  console.log('\n=== Headers check ===');
  await ssh('curl -sI https://namainvist.com/ 2>/dev/null | grep -iE "cache-control|x-nextjs-cache|cf-cache-status"');
  
  // Check if static file exists still
  const staticCheck = await ssh('ls -la /www/wwwroot/namainvist.com/.next/server/app/index.html 2>/dev/null || echo "✅ No static index.html (page is now dynamic)"');
  console.log('\nStatic file check:', staticCheck);
  
  console.log('\n✅ Done - try https://namainvist.com now');
})();
