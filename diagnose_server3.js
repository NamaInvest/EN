const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected');
  
  const commands = [
    // Check nginx config for namainvist.com
    'cat /www/server/panel/vhost/nginx/namainvist.com.conf 2>/dev/null || cat /etc/nginx/sites-enabled/namainvist.com 2>/dev/null || grep -r "namainvist" /etc/nginx/sites-enabled/ 2>/dev/null || grep -r "namainvist" /www/server/panel/vhost/nginx/ 2>/dev/null | head -50',
    // Check the actual error in more detail - more logs
    'pm2 logs main-site --lines 100 --nostream 2>&1 | grep -A5 "Error" | head -80',
    // Check if the layout.tsx was built properly - check the built output
    'ls -la /www/wwwroot/namainvist.com/.next/server/app/ 2>/dev/null | head -30',
    // Check the root page 
    'curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>&1',
    // Check sign-in
    'curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/sign-in 2>&1',
    // Check sign-up 
    'curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/sign-up 2>&1',
    // Get the actual error from sign-in
    'curl -s http://localhost:3000/sign-in 2>&1 | tail -5',
  ];
  
  let idx = 0;
  function runNext() {
    if (idx >= commands.length) { conn.end(); return; }
    const cmd = commands[idx++];
    console.log(`\n${'='.repeat(60)}\n>>> ${cmd}\n${'='.repeat(60)}`);
    conn.exec(cmd, (err, stream) => {
      if (err) { console.error('Exec error:', err); runNext(); return; }
      stream.on('data', (d) => process.stdout.write(d));
      stream.stderr.on('data', (d) => process.stderr.write(d));
      stream.on('close', () => runNext());
    });
  }
  runNext();
});

conn.on('error', (err) => console.error('SSH Error:', err.message));
conn.connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
