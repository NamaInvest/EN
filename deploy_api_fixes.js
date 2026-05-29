const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' };
const ARCHIVE_NAME = 'update_wave2.tar.gz';
const LOCAL_ARCHIVE = path.join(__dirname, ARCHIVE_NAME);
const REMOTE_ARCHIVE = `/root/${ARCHIVE_NAME}`;

const NODES = [
    '/www/wwwroot/namainvist.com',
    '/www/wwwroot/n1.namainvist.com',
    '/www/wwwroot/n11.namainvist.com'
];

function execCommand(conn, cmd) {
    return new Promise((resolve, reject) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            let stdout = '', stderr = '';
            stream.on('data', d => { stdout += d; });
            stream.stderr.on('data', d => { stderr += d; });
            stream.on('close', (code) => resolve({ code, stdout, stderr }));
        });
    });
}

async function uploadFile(sftp, localPath, remotePath) {
    return new Promise((resolve, reject) => {
        sftp.fastPut(localPath, remotePath, (err) => {
            if (err) return reject(err);
            resolve();
        });
    });
}

async function run() {
    console.log('Connecting to fleet server (46.4.188.170)...');
    const conn = new Client();
    
    conn.on('ready', () => {
        console.log('Connected! Uploading archive...');
        conn.sftp(async (err, sftp) => {
            if (err) throw err;
            try {
                await uploadFile(sftp, LOCAL_ARCHIVE, REMOTE_ARCHIVE);
                console.log('Upload complete.');

                for (const node of NODES) {
                    console.log(`\n================ Processing ${node} ================`);
                    console.log(`Extracting archive in ${node}...`);
                    let res = await execCommand(conn, `cd ${node} && tar -xzf ${REMOTE_ARCHIVE}`);
                    if (res.stderr) console.error(res.stderr);

                    console.log(`Building Next.js for ${node}...`);
                    res = await execCommand(conn, `cd ${node} && rm -rf .next && npm run build`);
                    console.log(res.stdout);
                    if (res.stderr && !res.stderr.includes('warn')) console.error(res.stderr);
                }

                console.log('\nRestarting PM2 for all apps...');
                await execCommand(conn, 'pm2 restart main-site n1-main saas-app');
                console.log('Done!');
                
                // Cleanup
                await execCommand(conn, `rm ${REMOTE_ARCHIVE}`);
                
            } catch (err) {
                console.error('Deployment failed:', err);
            } finally {
                conn.end();
            }
        });
    });
    
    conn.on('error', (err) => {
        console.error('Connection error:', err);
    });

    conn.connect(SERVER);
}

run();
