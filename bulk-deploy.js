const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };

const files = fs.readFileSync('changed-files-utf8.txt', 'utf8').split('\n').filter(Boolean);
// also add layout.tsx because we just modified it
if (!files.includes('src/app/(dashboard)/layout.tsx')) {
    files.push('src/app/(dashboard)/layout.tsx');
}

console.log(`Preparing to upload ${files.length} files...`);

function uploadFile(conn, localPath, remotePath) {
    return new Promise((resolve, reject) => {
        conn.sftp((err, sftp) => {
            if (err) return reject(err);
            const content = fs.readFileSync(localPath);
            sftp.writeFile(remotePath, content, (err) => {
                sftp.end();
                if (err) return reject(err);
                resolve();
            });
        });
    });
}

function exec(conn, cmd) {
    return new Promise((resolve, reject) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            stream.on('data', d => process.stdout.write(d));
            stream.stderr.on('data', d => process.stderr.write(d));
            stream.on('close', resolve);
        });
    });
}

const conn = new Client();
conn.on('ready', async () => {
    try {
        console.log('✅ Connected to Hetzner. Uploading files to /www/wwwroot/namainvist.com...');
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const localPath = path.resolve(file);
            if (fs.existsSync(localPath)) {
                const remotePath = `/www/wwwroot/namainvist.com/${file.replace(/\\/g, '/')}`;
                // create dir if needed
                const remoteDir = path.dirname(remotePath);
                await exec(conn, `mkdir -p "${remoteDir}"`);
                await uploadFile(conn, localPath, remotePath);
                if (i % 10 === 0) console.log(`  Uploaded ${i}/${files.length}...`);
            }
        }
        console.log('✅ All files uploaded. Starting build...');
        
        // Build and restart
        await exec(conn, `cd /www/wwwroot/namainvist.com && npm run build && pm2 reload all`);
        
        console.log('🎉 Done!');
    } catch(e) {
        console.error('Error:', e);
    } finally {
        conn.end();
    }
}).connect(SERVER);
