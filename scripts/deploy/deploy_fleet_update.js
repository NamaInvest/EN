/**
 * Fleet Deploy v2 — Upload once, copy internally to all nodes
 */
const { Client } = require('ssh2');
const path = require('path');

const HOST = '46.4.188.170';
const PASSWORD = '_ee4SWbxLVfH9b';
const LOCAL_BASE = 'c:\\Users\\1\\Desktop\\alfa';

const FILES = [
    'src/lib/totp.ts',
    'src/lib/cloud-storage.ts',
    'src/lib/email.ts',
    'src/lib/formatters.ts',
    'src/app/api/auth/login/route.ts',
    'src/app/api/auth/2fa/setup/route.ts',
    'src/app/api/auth/2fa/verify/route.ts',
    'src/app/api/auth/2fa/login/route.ts',
    'src/app/api/reports/export/route.ts',
    'src/app/api/reports/bi-export/route.ts',
    'src/app/api/delivery-platforms/route.ts',
    'src/app/api/shipments/route.ts',
    'src/app/api/contracts/alerts/route.ts',
    'prisma/schema.prisma',
];

// N1 already deployed. These are the remaining nodes.
const NODES = ['namainvist.com','n2.namainvist.com','n3.namainvist.com','n4.namainvist.com','n5.namainvist.com','n6.namainvist.com','n7.namainvist.com','n8.namainvist.com','n9.namainvist.com','n10.namainvist.com','n11.namainvist.com'];
const PM2_MAP = {'namainvist.com':'main-site','n2.namainvist.com':'n2','n3.namainvist.com':'n3','n4.namainvist.com':'n4','n5.namainvist.com':'n5','n6.namainvist.com':'n6','n7.namainvist.com':'n7','n8.namainvist.com':'n8','n9.namainvist.com':'n9','n10.namainvist.com':'n10','n11.namainvist.com':'n11'};

function execCmd(conn, cmd) {
    return new Promise((resolve) => {
        conn.exec(cmd, (err, stream) => {
            if (err) { resolve('ERROR: ' + err.message); return; }
            let out = '';
            stream.on('data', (d) => out += d.toString());
            stream.stderr.on('data', (d) => out += d.toString());
            stream.on('close', () => resolve(out));
        });
    });
}

function uploadFiles(conn) {
    return new Promise((resolve, reject) => {
        conn.sftp((err, sftp) => {
            if (err) { reject(err); return; }
            let done = 0;
            // Upload to n1 as source (already has dirs)
            FILES.forEach(file => {
                const local = path.join(LOCAL_BASE, file);
                const remote = `/www/wwwroot/n1.namainvist.com/${file}`;
                sftp.fastPut(local, remote, () => {
                    done++;
                    if (done === FILES.length) resolve();
                });
            });
        });
    });
}

(async () => {
    const conn = new Client();
    
    conn.on('ready', async () => {
        console.log('Connected to fleet server');
        
        // Step 1: Make sure source (n1) has latest files
        console.log('Step 1: Uploading files to n1 (source)...');
        await uploadFiles(conn);
        console.log(`Uploaded ${FILES.length} files to n1\n`);
        
        // Step 2: Copy from n1 to all other nodes
        console.log('Step 2: Copying to all nodes...');
        const dirs = [...new Set(FILES.map(f => path.posix.dirname(f)))];
        
        for (const node of NODES) {
            const nodePath = `/www/wwwroot/${node}`;
            // Check if exists
            const check = await execCmd(conn, `test -d ${nodePath}/src && echo OK || echo NO`);
            if (check.trim().includes('NO')) {
                console.log(`  [${node}] SKIP — doesn't exist`);
                continue;
            }
            
            // Create dirs
            const mkdirs = dirs.map(d => `mkdir -p ${nodePath}/${d}`).join('; ');
            await execCmd(conn, mkdirs);
            
            // Copy files
            const copies = FILES.map(f => `cp /www/wwwroot/n1.namainvist.com/${f} ${nodePath}/${f}`).join('; ');
            await execCmd(conn, copies);
            console.log(`  [${node}] ✅ Files copied`);
        }
        
        // Step 3: Build and restart each node sequentially
        console.log('\nStep 3: Building and restarting nodes...');
        for (const node of NODES) {
            const nodePath = `/www/wwwroot/${node}`;
            const pm2Name = PM2_MAP[node];
            
            const check = await execCmd(conn, `test -d ${nodePath}/src && echo OK || echo NO`);
            if (check.trim().includes('NO')) continue;
            
            console.log(`  [${node}] Building...`);
            const result = await execCmd(conn, `cd ${nodePath} && npx prisma generate 2>&1 && npm run build 2>&1 && pm2 restart ${pm2Name} 2>&1 && echo __DONE__`);
            
            if (result.includes('__DONE__')) {
                console.log(`  [${node}] ✅ BUILD OK + PM2 restarted`);
            } else if (result.includes('Build error')) {
                console.log(`  [${node}] ❌ Build failed — restarting PM2 with old build`);
                await execCmd(conn, `pm2 restart ${pm2Name} 2>/dev/null`);
            } else {
                console.log(`  [${node}] ⚠️ Unknown result`);
            }
        }
        
        console.log('\n=== Fleet deploy complete ===');
        conn.end();
    });
    
    conn.on('error', (err) => { console.error('Connection failed:', err.message); });
    conn.connect({ host: HOST, port: 22, username: 'root', password: PASSWORD, readyTimeout: 30000 });
})();
