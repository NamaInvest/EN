const { Client } = require('ssh2');
const fs = require('fs');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' };

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
        console.log('✅ Connected to Hetzner. Uploading TAR...');
        await uploadFile(conn, 'update.tar.gz', '/www/wwwroot/namainvist.com/update.tar.gz');
        console.log('✅ TAR uploaded. Extracting and building...');
        
        // Build and restart
        await exec(conn, `cd /www/wwwroot/namainvist.com && tar -xzf update.tar.gz && rm update.tar.gz && npm run build && pm2 reload all`);
        
        console.log('🎉 Done!');
    } catch(e) {
        console.error('Error:', e);
    } finally {
        conn.end();
    }
}).connect(SERVER);
