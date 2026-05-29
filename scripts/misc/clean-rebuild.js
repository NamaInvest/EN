const { Client } = require('ssh2');

function sshStream(cmd, onData) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => {
      c.exec(cmd, (err, stream) => {
        stream.on('data', d => { process.stdout.write(d.toString()); if (onData) onData(d.toString()); });
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', (code) => { c.end(); r(code); });
      });
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
  });
}

(async () => {
  console.log('🧹 Clearing ALL cache and rebuilding...\n');
  
  // Full clean rebuild
  const code = await sshStream(
    'cd /www/wwwroot/namainvist.com && ' +
    'rm -rf .next && ' +
    'rm -rf node_modules/.cache && ' +
    'npm run build 2>&1'
  );
  
  console.log('\nBuild exit code:', code);
  
  if (code === 0) {
    // Check what's in the built HTML now
    await sshStream('grep -c "وحدة برمجية" /www/wwwroot/namainvist.com/.next/server/app/index.html 2>&1 && echo "---FOUND---"');
    
    // Restart
    await sshStream('pm2 restart main-site 2>&1 | tail -5');
    console.log('\n✅ Clean build + restart done!');
  }
})();
