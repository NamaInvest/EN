const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const REMOTE_APP = '/www/wwwroot/namainvist.com';

const filesToUpload = [
  { local: 'src/app/ice/layout.tsx', remote: `${REMOTE_APP}/src/app/ice/layout.tsx` },
  { local: 'src/app/ice/page.tsx', remote: `${REMOTE_APP}/src/app/ice/page.tsx` },
  { local: 'src/app/layout.tsx', remote: `${REMOTE_APP}/src/app/layout.tsx` },
];

const conn = new Client();

conn.on('ready', () => {
  console.log('✅ Connected to fleet server');
  
  conn.sftp((err, sftp) => {
    if (err) { console.error('SFTP error:', err); conn.end(); return; }
    
    let uploaded = 0;
    filesToUpload.forEach(file => {
      const localPath = path.join(__dirname, file.local);
      const content = fs.readFileSync(localPath);
      
      sftp.writeFile(file.remote, content, (err) => {
        if (err) {
          console.error(`❌ Failed to upload ${file.local}:`, err.message);
        } else {
          console.log(`📤 Uploaded: ${file.local}`);
        }
        uploaded++;
        if (uploaded === filesToUpload.length) {
          console.log('\n🔨 Building and restarting...');
          conn.exec(`cd ${REMOTE_APP} && npm run build 2>&1 | tail -15 && pm2 restart main-site && echo "\\n✅ DEPLOY COMPLETE" && sleep 4 && curl -s -o /dev/null -w "ICE: %{http_code}\\n" http://localhost:3000/ice && curl -s -o /dev/null -w "Desktop-Licenses: %{http_code}\\n" http://localhost:3000/ice/desktop-licenses && curl -s -o /dev/null -w "Sign-in: %{http_code}\\n" http://localhost:3000/sign-in`, (err, stream) => {
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
