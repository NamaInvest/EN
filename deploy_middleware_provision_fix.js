/**
 * Deploy middleware fix + font changes to Main Site (namainvist.com)
 * Fixes: /api/tenant/provision returning HTML instead of JSON
 */
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const SSH_HOST = '46.4.188.170';
const SSH_USER = 'root';
const SSH_PASS = '_ee4SWbxLVfH9b';
const REMOTE_APP = '/www/wwwroot/namainvist.com';

const FILES_TO_UPLOAD = [
    { local: 'src/middleware.ts',           remote: `${REMOTE_APP}/src/middleware.ts` },
    { local: 'src/app/globals.css',         remote: `${REMOTE_APP}/src/app/globals.css` },
    { local: 'src/app/layout.tsx',          remote: `${REMOTE_APP}/src/app/layout.tsx` },
    { local: 'src/app/_landing.tsx',        remote: `${REMOTE_APP}/src/app/_landing.tsx` },
];

function uploadFile(conn, localPath, remotePath) {
    return new Promise((resolve, reject) => {
        conn.sftp((err, sftp) => {
            if (err) return reject(err);
            const content = fs.readFileSync(path.resolve(__dirname, localPath));
            sftp.writeFile(remotePath, content, (err) => {
                if (err) return reject(err);
                console.log(`  ✅ ${localPath} → ${remotePath}`);
                resolve();
            });
        });
    });
}

function runCmd(conn, cmd) {
    return new Promise((resolve, reject) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            let out = '';
            stream.on('data', (d) => out += d.toString());
            stream.stderr.on('data', (d) => out += d.toString());
            stream.on('close', (code) => {
                resolve({ code, out });
            });
        });
    });
}

async function main() {
    const conn = new Client();
    
    conn.on('ready', async () => {
        console.log('🔗 Connected to Fleet Server');
        
        try {
            // Step 1: Upload files
            console.log('\n📤 Uploading files...');
            for (const file of FILES_TO_UPLOAD) {
                await uploadFile(conn, file.local, file.remote);
            }
            
            // Step 2: Build & Restart
            console.log('\n🔨 Building Main Site...');
            const buildResult = await runCmd(conn, 
                `cd ${REMOTE_APP} && npm run build 2>&1 | tail -20`
            );
            console.log(buildResult.out);
            
            console.log('\n🔄 Restarting PM2...');
            const restartResult = await runCmd(conn, 
                `pm2 restart main-site 2>&1`
            );
            console.log(restartResult.out);
            
            console.log('\n✅ Deploy complete! Main Site updated.');
            console.log('   🌐 https://namainvist.com');
            
        } catch (e) {
            console.error('❌ Error:', e.message);
        } finally {
            conn.end();
        }
    });
    
    conn.on('error', (err) => {
        console.error('❌ SSH Connection Error:', err.message);
    });
    
    conn.connect({
        host: SSH_HOST,
        port: 22,
        username: SSH_USER,
        password: SSH_PASS,
        readyTimeout: 20000,
    });
}

main();
