const { Client } = require('ssh2');

const conn = new Client();
const HOST = '46.4.188.170';
const PASSWORD = '_ee4SWbxLVfH9b';

conn.on('ready', () => {
  console.log('Connected to fleet server');
  
  const commands = [
    // Check PM2 status for main-site
    'pm2 list 2>&1 | head -20',
    // Check main-site logs for errors
    'pm2 logs main-site --lines 30 --nostream 2>&1',
    // Check if the app is running and responding
    'curl -s -o /dev/null -w "%{http_code}" http://localhost:2999/',
    // Check sign-in page
    'curl -s -o /dev/null -w "%{http_code}" http://localhost:2999/sign-in',
    // Check environment vars
    'cd /www/wwwroot/namainvist.com && cat .env | grep -E "CLERK|DESKTOP" 2>&1',
    // Check .env.local
    'cd /www/wwwroot/namainvist.com && cat .env.local 2>/dev/null || echo "No .env.local"',
    // Check next config  
    'cd /www/wwwroot/namainvist.com && cat next.config.ts 2>/dev/null || cat next.config.js 2>/dev/null || echo "No next config found"',
    // Check if node_modules has clerk
    'ls /www/wwwroot/namainvist.com/node_modules/@clerk/nextjs/package.json 2>/dev/null && echo "Clerk exists" || echo "Clerk NOT found"',
    // Check error logs
    'cat /root/.pm2/logs/main-site-error.log 2>/dev/null | tail -40',
  ];
  
  const allCmds = commands.join(' && echo "===SEPARATOR===" && ');
  
  conn.exec(allCmds, (err, stream) => {
    if (err) { console.error('Exec error:', err); conn.end(); return; }
    let out = '';
    stream.on('data', d => { out += d.toString(); });
    stream.stderr.on('data', d => { out += d.toString(); });
    stream.on('close', () => {
      console.log(out);
      conn.end();
    });
  });
});

conn.on('error', (err) => {
  console.error('SSH Error:', err.message);
});

conn.connect({
  host: HOST,
  port: 22,
  username: 'root',
  password: PASSWORD,
});
