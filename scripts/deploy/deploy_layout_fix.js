const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();

conn.on('ready', () => {
  console.log('Connected to fleet server');
  
  // Read the local layout.tsx
  const layoutPath = path.join(__dirname, 'src', 'app', 'layout.tsx');
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  
  // Base64 encode to avoid escaping issues
  const b64 = Buffer.from(layoutContent).toString('base64');
  
  const commands = [
    // Backup current layout
    `cp /www/wwwroot/namainvist.com/src/app/layout.tsx /www/wwwroot/namainvist.com/src/app/layout.tsx.bak.$(date +%s)`,
    // Write new layout
    `echo '${b64}' | base64 -d > /www/wwwroot/namainvist.com/src/app/layout.tsx`,
    // Verify it was written
    `echo "--- Layout written, size: $(wc -c < /www/wwwroot/namainvist.com/src/app/layout.tsx) bytes ---"`,
    // Build
    `cd /www/wwwroot/namainvist.com && npm run build 2>&1 | tail -20`,
    // Restart PM2
    `pm2 restart main-site 2>&1`,
    // Wait a bit and check
    `sleep 3 && curl -s -o /dev/null -w "Homepage: %{http_code}" http://localhost:3000/`,
    `curl -s -o /dev/null -w " | Sign-in: %{http_code}" http://localhost:3000/sign-in`,
  ];
  
  const allCmds = commands.join(' && ');
  
  conn.exec(allCmds, { timeout: 300000 }, (err, stream) => {
    if (err) { console.error('Exec error:', err); conn.end(); return; }
    let out = '';
    stream.on('data', d => { 
      const s = d.toString(); 
      out += s; 
      process.stdout.write(s);
    });
    stream.stderr.on('data', d => { 
      const s = d.toString(); 
      out += s;
      process.stderr.write(s);
    });
    stream.on('close', () => {
      console.log('\n\n=== DEPLOYMENT COMPLETE ===');
      conn.end();
    });
  });
});

conn.on('error', (err) => {
  console.error('SSH Error:', err.message);
});

conn.connect({
  host: '46.4.188.170',
  port: 22,
  username: 'root',
  password: '_ee4SWbxLVfH9b',
});
