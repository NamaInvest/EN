const { Client } = require('ssh2');
const fs = require('fs');
const archiver = require('archiver');
const path = require('path');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
};

const TARGET_DIR = '/www/wwwroot/n11.namainvist.com';
const PM2_NAME = 'n11';

async function deploy() {
    console.log('[1/4] Zipping the src folder...');
    const zipPath = path.join(__dirname, 'n11_update.zip');
    
    await new Promise((resolve, reject) => {
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });
        output.on('close', resolve);
        archive.on('error', reject);
        archive.pipe(output);
        archive.directory(path.join(__dirname, 'src'), 'src');
        archive.finalize();
    });

    console.log('[2/4] Connecting to Fleet Server (N11 node)...');
    const conn = new Client();
    
    conn.on('ready', () => {
        console.log('[3/4] Uploading updates to N11 only...');
        conn.sftp((err, sftp) => {
            if (err) throw err;
            const readStream = fs.createReadStream(zipPath);
            const writeStream = sftp.createWriteStream(`${TARGET_DIR}/n11_update.zip`);
            
            writeStream.on('close', () => {
                console.log('[4/4] Extracting & Building on N11 exclusively...');
                
                const cmd = `
                    cd ${TARGET_DIR} && 
                    unzip -o n11_update.zip && 
                    rm n11_update.zip && 
                    rm -f src/app/api/tenant/provision/route.ts &&
                    npm run build && 
                    pm2 restart ${PM2_NAME}
                `;
                
                conn.exec(cmd, (err, stream) => {
                    if (err) throw err;
                    stream.on('close', (code, signal) => {
                        console.log(`\n✅ N11 Deployment Successful (Code: ${code})`);
                        fs.unlinkSync(zipPath);
                        conn.end();
                    }).on('data', (data) => {
                        process.stdout.write(data);
                    }).stderr.on('data', (data) => {
                        process.stderr.write(data);
                    });
                });
            });
            readStream.pipe(writeStream);
        });
    }).connect(config);
}

deploy().catch(console.error);
