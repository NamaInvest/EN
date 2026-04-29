const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const HOST = '46.4.188.170';
const USER = 'root';
const PASS = '_ee4SWbxLVfH9b';
const BASE = '/www/wwwroot/namainvist.com';

const files = [
  { local: 'src/app/ice/desktop-licenses/page.tsx', remote: `${BASE}/src/app/ice/desktop-licenses/page.tsx` },
  { local: 'src/app/api/ice/desktop-licenses/route.ts', remote: `${BASE}/src/app/api/ice/desktop-licenses/route.ts` },
  { local: 'src/app/api/ice/desktop-register/route.ts', remote: `${BASE}/src/app/api/ice/desktop-register/route.ts` },
  { local: 'src/app/api/ice/backup/upload/route.ts', remote: `${BASE}/src/app/api/ice/backup/upload/route.ts` },
  { local: 'src/app/api/ice/backup/download/route.ts', remote: `${BASE}/src/app/api/ice/backup/download/route.ts` },
  { local: 'src/app/api/ice/backup/list/route.ts', remote: `${BASE}/src/app/api/ice/backup/list/route.ts` },
  { local: 'src/app/ice/page.tsx', remote: `${BASE}/src/app/ice/page.tsx` },
];

const conn = new Client();
conn.on('ready', () => {
  console.log('✅ Connected to fleet server');

  const dirs = [
    `${BASE}/src/app/ice/desktop-licenses`,
    `${BASE}/src/app/api/ice/desktop-licenses`,
    `${BASE}/src/app/api/ice/desktop-register`,
    `${BASE}/src/app/api/ice/backup/upload`,
    `${BASE}/src/app/api/ice/backup/download`,
    `${BASE}/src/app/api/ice/backup/list`,
  ];

  conn.exec(`mkdir -p ${dirs.join(' ')} /tmp/nama-backups`, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      console.log('📁 Directories created');

      conn.sftp((err, sftp) => {
        if (err) throw err;
        let uploaded = 0;
        files.forEach(f => {
          const localPath = path.join(__dirname, f.local);
          console.log(`📤 Uploading ${f.local}...`);
          sftp.fastPut(localPath, f.remote, (err) => {
            if (err) { console.error(`❌ ${f.local}:`, err.message); }
            else { console.log(`   ✅ ${f.local}`); }
            uploaded++;
            if (uploaded === files.length) {
              console.log('\n🔨 Building and restarting...');
              conn.exec(`cd ${BASE} && npm run build && pm2 restart main-site`, (err, stream) => {
                if (err) throw err;
                stream.on('data', d => process.stdout.write(d));
                stream.stderr.on('data', d => process.stderr.write(d));
                stream.on('close', (code) => {
                  console.log(`\n🚀 Deploy done! Exit code: ${code}`);
                  conn.end();
                });
              });
            }
          });
        });
      });
    });
    stream.on('data', d => process.stdout.write(d));
  });
});

conn.on('error', e => { console.error('Connection error:', e.message); });
conn.connect({ host: HOST, port: 22, username: USER, password: PASS });
