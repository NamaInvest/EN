const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const conn = new Client();
const BASE = '/www/wwwroot/namainvist.com';

conn.on('ready', () => {
  console.log('✅ Connected');
  conn.sftp((err, sftp) => {
    if (err) { console.error(err); conn.end(); return; }
    
    const files = [
      'src/app/(dashboard)/recurring-invoices/page.tsx',
      'src/app/(dashboard)/assets/page.tsx',
    ];
    
    let done = 0;
    files.forEach(f => {
      const local = path.join(process.cwd(), f);
      const remote = `${BASE}/${f}`;
      let content = fs.readFileSync(local, 'utf8');
      if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
      
      sftp.writeFile(remote, Buffer.from(content, 'utf8'), (err) => {
        done++;
        console.log(`  ${err ? '❌' : '✅'} ${f}`);
        if (done === files.length) {
          sftp.end();
          rebuild();
        }
      });
    });
  });
  
  function rebuild() {
    conn.exec(`cd ${BASE} && \
export NODE_OPTIONS="--max-old-space-size=4096" && \
npx next build 2>&1 | tail -5 && \
cat .next/BUILD_ID 2>&1 && echo "" && \
pm2 restart all && \
sleep 5 && \
curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/recurring-invoices" && \
echo "" && echo "=== DONE ==="`, (err, stream) => {
      if (err) { console.error(err); conn.end(); return; }
      stream.on('data', d => process.stdout.write(d));
      stream.stderr.on('data', d => process.stderr.write(d));
      stream.on('close', () => { console.log('🎉'); conn.end(); });
    });
  }
});
conn.connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
