const { Client } = require('ssh2'); 
const conn = new Client(); 
conn.on('ready', () => { 
  const scriptContent = `
const fs = require('fs');
const path = '/www/wwwroot/n11.namainvist.com/src/components/SessionGuard.tsx';
let txt = fs.readFileSync(path, 'utf8');

txt = txt.replace(/if \\(!token\\) return;/g, "if (!token) { router.replace('/login'); return; }");

fs.writeFileSync(path, txt);
  `;
  conn.exec(`node -e "${scriptContent.replace(/"/g, '\\"')}" && cd /www/wwwroot/n11.namainvist.com && npm run build && pm2 restart n11 --update-env`, (err, stream) => { 
      stream.on('close', () => conn.end()).on('data', d => process.stdout.write(d.toString())); 
      stream.stderr.on('data', d => process.stderr.write(d.toString()));
  }); 
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
