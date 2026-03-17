const { Client } = require('ssh2');
const path = require('path');
const fs = require('fs');

const files = [
    // 1. Coupons
    'src/app/api/coupons/route.ts',
    'src/app/api/coupons/[id]/route.ts',
    'src/app/(dashboard)/coupons/page.tsx',
    // 2. Loyalty
    'src/app/api/loyalty/route.ts',
    'src/app/api/loyalty/[customerId]/transactions/route.ts',
    'src/app/(dashboard)/loyalty/page.tsx',
    // 3. Gift Cards
    'src/app/api/gift-cards/route.ts',
    'src/app/api/gift-cards/[id]/route.ts',
    'src/app/(dashboard)/gift-cards/page.tsx',
    // 4. Audit Logs
    'src/app/api/audit-logs/route.ts',
    'src/app/(dashboard)/audit-logs/page.tsx',
    // 5. Batches
    'src/app/api/batches/route.ts',
    'src/app/api/batches/[id]/route.ts',
    'src/app/(dashboard)/batches/page.tsx',
    // Modified System Files & Hotfixes
    'src/components/Sidebar.tsx',
    'src/lib/i18n.tsx',
    'src/app/(dashboard)/settings/page.tsx',
    'src/app/login/page.tsx',
    'src/components/InactivityGuard.tsx',

    // ZATCA Phase 2 Modifications & Other Fixes
    'src/app/api/sales/route.ts',
    'src/app/api/banks/[id]/route.ts',
    'src/app/api/banks/[id]/transactions/route.ts',
    'src/app/api/expenses/route.ts',
    'src/app/api/manufacturing/recipes/route.ts',
    'src/app/api/shifts/route.ts',
];

const dirsToCreate = [...new Set(files.map(f => path.dirname(f).replace(/\\/g, '/')))];

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected to VPS: 95.217.187.44');
    
    const mkDirCommand = dirsToCreate.map(d => `mkdir -p "/var/www/namasoft/${d}"`).join(' && ');
    conn.exec(mkDirCommand, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            console.log('Directories created. Starting file upload...');
            conn.sftp((err, sftp) => {
                if (err) throw err;
                let done = 0;
                for (const file of files) {
                    const localPath = path.resolve('d:/namasoft9-3-main', file);
                    const remotePath = `/var/www/namasoft/${file}`;
                    sftp.fastPut(localPath, remotePath, (e) => {
                        done++;
                        if (e) console.error('FAIL', file, e.message);
                        else console.log('OK', file);
                        
                        if (done === files.length) {
                            console.log('\nAll files uploaded to srv2!');
                            // Trigger build
                            const buildCmd = 'rm -f /tmp/rebuild_modules_status.txt && cd /var/www/namasoft && nohup bash -c "npx prisma generate && npm run build > /tmp/rebuild_modules.log 2>&1 && pm2 restart namasoft && echo DONE > /tmp/rebuild_modules_status.txt" > /dev/null 2>&1 &';
                            conn.exec(buildCmd, (e2, s2) => {
                                if (e2) throw e2;
                                s2.on('close', () => { 
                                    console.log('Build kicked off in background on srv2!'); 
                                    conn.end(); 
                                });
                            });
                        }
                    });
                }
            });
        }).on('data', (d) => console.log('MKDIR OUT:', d.toString()))
          .stderr.on('data', (d) => console.error('MKDIR ERR:', d.toString()));
    });
}).on('error', (err) => {
    console.error('Connection logic error:', err);
}).connect({
    host: '95.217.187.44', port: 22, username: 'root', 
    privateKey: fs.readFileSync('C:/Users/1/.ssh/hetzner_key'), 
    keepaliveInterval: 10000
});
