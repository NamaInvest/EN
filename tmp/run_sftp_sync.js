const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const SERVER = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
};

const REMOTE_BASE = '/www/wwwroot/namainvist.com';
const LOCAL_BASE = 'd:\\namasoft9-3-main';

const filesToSync = JSON.parse(fs.readFileSync('sync_report.json', 'utf8'));

const conn = new Client();

function makeRemoteDir(sftp, dir) {
    return new Promise((resolve) => {
        sftp.mkdir(dir, (err) => {
            // resolve in all cases (directory might already exist)
            resolve();
        });
    });
}

async function ensureRemoteDirExists(sftp, remotePath) {
    const relativeDir = path.dirname(remotePath).replace(REMOTE_BASE, '').replace(/\\/g, '/');
    const parts = relativeDir.split('/').filter(Boolean);
    let current = REMOTE_BASE;
    for (const part of parts) {
        current += '/' + part;
        await makeRemoteDir(sftp, current);
    }
}

conn.on('ready', () => {
    console.log('CONNECTED TO FLEET SERVER successfully.');
    
    conn.sftp(async (err, sftp) => {
        if (err) throw err;
        
        console.log(`Starting SFTP Upload of ${filesToSync.length} files...`);
        
        for (let i = 0; i < filesToSync.length; i++) {
            const relPath = filesToSync[i];
            const localPath = path.join(LOCAL_BASE, relPath);
            const remotePath = `${REMOTE_BASE}/${relPath}`;
            
            console.log(`[${i + 1}/${filesToSync.length}] Uploading ${relPath}...`);
            
            await ensureRemoteDirExists(sftp, remotePath);
            
            await new Promise((resolve, reject) => {
                sftp.fastPut(localPath, remotePath, (err) => {
                    if (err) {
                        console.error(`❌ Failed to upload ${relPath}:`, err.message);
                        reject(err);
                    } else {
                        console.log(`  ✅ Successfully uploaded ${relPath}`);
                        resolve();
                    }
                });
            });
        }
        
        console.log('\n🎉 All files synced to Fleet Server successfully via SFTP!');
        sftp.end();
        conn.end();
    });
}).on('error', (e) => {
    console.error('SSH Connection Error:', e.message);
}).connect(SERVER);
