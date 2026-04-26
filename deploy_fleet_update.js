/**
 * Deploy to ALL nodes on Fleet Server (46.4.188.170)
 */
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const HOST = '46.4.188.170';
const PASSWORD = '_ee4SWbxLVfH9b';
const LOCAL_BASE = 'd:\\namasoft9-3-main';

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

const NODES = [
    { name: 'main-site', path: '/www/wwwroot/namainvist.com', pm2: 'main-site' },
    { name: 'n2', path: '/www/wwwroot/n2.namainvist.com', pm2: 'n2' },
    { name: 'n3', path: '/www/wwwroot/n3.namainvist.com', pm2: 'n3' },
    { name: 'n4', path: '/www/wwwroot/n4.namainvist.com', pm2: 'n4' },
    { name: 'n5', path: '/www/wwwroot/n5.namainvist.com', pm2: 'n5' },
    { name: 'n6', path: '/www/wwwroot/n6.namainvist.com', pm2: 'n6' },
    { name: 'n7', path: '/www/wwwroot/n7.namainvist.com', pm2: 'n7' },
    { name: 'n8', path: '/www/wwwroot/n8.namainvist.com', pm2: 'n8' },
    { name: 'n9', path: '/www/wwwroot/n9.namainvist.com', pm2: 'n9' },
    { name: 'n10', path: '/www/wwwroot/n10.namainvist.com', pm2: 'n10' },
    { name: 'n11', path: '/www/wwwroot/n11.namainvist.com', pm2: 'n11' },
];

function deployToNode(node) {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        conn.on('ready', () => {
            console.log(`[${node.name}] Connected`);
            
            // First check if node directory exists
            conn.exec(`test -d ${node.path}/src && echo EXISTS || echo MISSING`, (err, stream) => {
                if (err) { conn.end(); resolve(); return; }
                let result = '';
                stream.on('data', (d) => result += d.toString().trim());
                stream.on('close', () => {
                    if (result.includes('MISSING')) {
                        console.log(`[${node.name}] SKIPPED — directory doesn't exist`);
                        conn.end();
                        resolve();
                        return;
                    }
                    
                    // Create directories
                    const dirs = [...new Set(FILES.map(f => path.posix.dirname(f)))];
                    const mkdirCmd = dirs.map(d => `mkdir -p ${node.path}/${d}`).join(' && ');
                    
                    conn.exec(mkdirCmd, (err, stream) => {
                        if (err) { conn.end(); resolve(); return; }
                        stream.on('close', () => {
                            conn.sftp((err, sftp) => {
                                if (err) { conn.end(); resolve(); return; }
                                
                                let uploaded = 0;
                                let errors = 0;
                                FILES.forEach(file => {
                                    const localPath = path.join(LOCAL_BASE, file);
                                    const remotePath = `${node.path}/${file}`;
                                    
                                    sftp.fastPut(localPath, remotePath, (err) => {
                                        uploaded++;
                                        if (err) { errors++; }
                                        
                                        if (uploaded === FILES.length) {
                                            console.log(`[${node.name}] ${uploaded - errors}/${uploaded} files uploaded`);
                                            
                                            // Prisma generate + Build + Restart
                                            console.log(`[${node.name}] Building...`);
                                            conn.exec(`cd ${node.path} && npx prisma generate 2>&1 && npm run build 2>&1 && pm2 restart ${node.pm2} 2>&1 && echo __BUILD_OK__`, 
                                            { pty: false }, (err, stream) => {
                                                if (err) { console.log(`[${node.name}] exec error`); conn.end(); resolve(); return; }
                                                let out = '';
                                                stream.on('data', (d) => out += d.toString());
                                                stream.stderr.on('data', (d) => out += d.toString());
                                                stream.on('close', () => {
                                                    if (out.includes('__BUILD_OK__')) {
                                                        console.log(`[${node.name}] ✅ BUILD DONE`);
                                                    } else {
                                                        console.log(`[${node.name}] ❌ BUILD FAILED`);
                                                        // Still try restart with old build
                                                        conn.exec(`pm2 restart ${node.pm2} 2>/dev/null`, () => {});
                                                    }
                                                    conn.end();
                                                    resolve();
                                                });
                                            });
                                        }
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
        conn.on('error', (err) => {
            console.error(`[${node.name}] Connection error: ${err.message}`);
            resolve(); // Don't reject, continue with next
        });
        conn.connect({ host: HOST, port: 22, username: 'root', password: PASSWORD, readyTimeout: 15000 });
    });
}

(async () => {
    console.log(`Deploying ${FILES.length} files to ${NODES.length} nodes on ${HOST}...\n`);
    for (const node of NODES) {
        await deployToNode(node);
        console.log('');
    }
    console.log('=== Fleet deploy complete ===');
})();
