const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const HOST = '46.4.188.170';
const USER = 'root';
const PASS = '_ee4SWbxLVfH9b';
const BASE = '/www/wwwroot/namainvist.com';

// Files that were fixed for Arabic encoding
const files = [
  'src/components/InvoiceReceipt.tsx',
  'src/components/TrialBanner.tsx',
  'src/components/QuotaModal.tsx',
  'src/components/VoucherReceipt.tsx',
  'src/components/ThemeSwitcher.tsx',
  'src/app/_module-filter.tsx',
  'src/app/sso-callback/page.tsx',
  'src/app/retail/page.tsx',
  'src/app/restaurant/page.tsx',
  'src/app/pharmacy/page.tsx',
  'src/app/factory/page.tsx',
  'src/app/auto-login/page.tsx',
  'src/app/attendance/face-id/page.tsx',
  'src/app/(dashboard)/warehouses/options/page.tsx',
  'src/app/(dashboard)/price-quotes/page.tsx',
  'src/app/layout.tsx',
];

const conn = new Client();
conn.on('ready', () => {
  console.log('✅ Connected to server');

  // Collect unique dirs
  const dirs = [...new Set(files.map(f => path.dirname(`${BASE}/${f}`)))];

  conn.exec(`mkdir -p ${dirs.join(' ')}`, (err) => {
    if (err) { console.error(err); conn.end(); return; }
    console.log('📁 Directories ensured');

    conn.sftp((err, sftp) => {
      if (err) { console.error(err); conn.end(); return; }

      let done = 0;
      for (const f of files) {
        const local = path.join('c:/Users/1/Desktop/alfa', f);
        const remote = `${BASE}/${f}`;
        
        if (!fs.existsSync(local)) {
          console.log(`⏭ Skip: ${f} (not found locally)`);
          done++;
          if (done === files.length) buildAndRestart();
          continue;
        }

        console.log(`📤 Uploading ${f}...`);
        sftp.fastPut(local, remote, (err) => {
          if (err) console.log(`   ❌ ${f}: ${err.message}`);
          else console.log(`   ✅ ${f}`);
          done++;
          if (done === files.length) buildAndRestart();
        });
      }

      function buildAndRestart() {
        console.log('\n🔨 Building and restarting...');
        conn.exec(`cd ${BASE} && npm run build && pm2 restart main-site`, (err, stream) => {
          if (err) { console.error(err); conn.end(); return; }
          let output = '';
          stream.on('data', (d) => { output += d; process.stdout.write(d); });
          stream.stderr.on('data', (d) => { process.stdout.write(d); });
          stream.on('close', (code) => {
            console.log(`\n🚀 Deploy done! Exit code: ${code}`);
            conn.end();
          });
        });
      }
    });
  });
});

conn.on('error', (err) => console.error('Connection error:', err.message));
conn.connect({ host: HOST, username: USER, password: PASS, port: 22 });
