const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const REMOTE_APP = '/www/wwwroot/namainvist.com';

const filesToUpload = [
  { local: 'src/app/ice/page.tsx', remote: `${REMOTE_APP}/src/app/ice/page.tsx` },
];

const conn = new Client();
conn.on('ready', () => {
  console.log('✅ Connected');
  conn.sftp((err, sftp) => {
    if (err) { console.error('SFTP error:', err); conn.end(); return; }
    
    let uploaded = 0;
    filesToUpload.forEach(file => {
      const content = fs.readFileSync(path.join(__dirname, file.local));
      sftp.writeFile(file.remote, content, (err) => {
        if (err) console.error(`❌ ${file.local}:`, err.message);
        else console.log(`📤 ${file.local}`);
        uploaded++;
        if (uploaded === filesToUpload.length) {
          console.log('\n🔨 Building...');
          conn.exec(`cd ${REMOTE_APP} && npm run build 2>&1 | tail -10 && pm2 restart main-site && echo "\\n✅ DONE" && sleep 4 && curl -s -o /dev/null -w "ICE: %{http_code}\\n" http://localhost:3000/ice`, (err, stream) => {
            if (err) { console.error('Exec error:', err); conn.end(); return; }
            stream.on('data', (d) => process.stdout.write(d));
            stream.stderr.on('data', (d) => process.stderr.write(d));
            stream.on('close', () => { console.log('\n🎉 Done!'); conn.end(); });
          });
        }
      });
    });
  });
});
conn.on('error', (err) => console.error('SSH Error:', err.message));
conn.connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
