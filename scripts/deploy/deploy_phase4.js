const { Client } = require('ssh2');
const path = require('path');

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
    // Modified System Files
    'src/components/Sidebar.tsx',
    'src/lib/i18n.tsx',
    'src/app/(dashboard)/settings/page.tsx'
];

const dirsToCreate = [
    'src/app/api/coupons',
    'src/app/api/coupons/[id]',
    'src/app/(dashboard)/coupons',
    'src/app/api/loyalty',
    'src/app/api/loyalty/[customerId]',
    'src/app/api/loyalty/[customerId]/transactions',
    'src/app/(dashboard)/loyalty',
    'src/app/api/gift-cards',
    'src/app/api/gift-cards/[id]',
    'src/app/(dashboard)/gift-cards',
    'src/app/api/audit-logs',
    'src/app/(dashboard)/audit-logs',
    'src/app/api/batches',
    'src/app/api/batches/[id]',
    'src/app/(dashboard)/batches'
];

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected to VPS');
    
    // Create necessary directories first (Quoted for bash)
    const mkDirCommand = dirsToCreate.map(d => `mkdir -p "/var/www/namasoft/${d}"`).join(' && ');
    conn.exec(mkDirCommand, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            console.log('Directories created. Starting file upload...');
            
            conn.sftp((err, sftp) => {
                if (err) throw err;
                let done = 0;
                for (const file of files) {
                    const localPath = path.resolve('c:/Users/1/Desktop/alfa', file);
                    const remotePath = `/var/www/namasoft/${file}`;
                    sftp.fastPut(localPath, remotePath, (e) => {
                        done++;
                        if (e) console.error('FAIL', file, e.message);
                        else console.log('OK', file);
                        
                        if (done === files.length) {
                            console.log('\\nAll Phase 4 files uploaded!');
                            // Trigger build
                            const buildCmd = 'rm -f /tmp/rebuild_modules_status.txt && cd /var/www/namasoft && nohup bash -c "npx prisma generate && npm run build > /tmp/rebuild_modules.log 2>&1 && pm2 restart namasoft && echo DONE > /tmp/rebuild_modules_status.txt" > /dev/null 2>&1 &';
                            conn.exec(buildCmd, (e2, s2) => {
                                if (e2) throw e2;
                                s2.on('close', () => { 
                                    console.log('Build kicked off in background!'); 
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
    host: '185.197.195.202', port: 22, username: 'root', password: 'VmJUML2LuezRSws', keepaliveInterval: 10000
});
