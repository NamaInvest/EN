const { Client } = require('ssh2');
const fs = require('fs');

const SERVER = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: 'process.env.SSH_PASSWORD'
};

const TARGETS = [
    '/www/wwwroot/namainvist.com',
    '/www/wwwroot/n1.namainvist.com',
    '/www/wwwroot/n11.namainvist.com'
];

function uploadFile(sftp, localPath, remotePath) {
    return new Promise((resolve, reject) => {
        const data = fs.readFileSync(localPath);
        sftp.writeFile(remotePath, data, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

function execCommand(conn, cmd) {
    return new Promise((resolve, reject) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            let stdout = '', stderr = '';
            stream.on('data', d => { stdout += d; process.stdout.write(d.toString()); });
            stream.stderr.on('data', d => { stderr += d; process.stderr.write(d.toString()); });
            stream.on('close', (code) => resolve({ code, stdout, stderr }));
        });
    });
}

async function run() {
    const conn = new Client();
    console.log('🔌 Connecting to Server...');
    
    conn.on('ready', async () => {
        console.log('✅ Connected!\n');
        try {
            const sftp = await new Promise((resolve, reject) => {
                conn.sftp((err, sftp) => err ? reject(err) : resolve(sftp));
            });

            for (const target of TARGETS) {
                console.log(`\n=== Processing Database on ${target} ===`);
                const remotePath = `${target}/update_db_names.js`;
                await uploadFile(sftp, 'd:\\namasoft9-3-main\\update_db_names.js', remotePath);
                console.log(`Uploaded update_db_names.js to ${target}`);
                
                await execCommand(conn, `cd ${target} && node update_db_names.js`);
                
                await execCommand(conn, `rm ${remotePath}`);
            }
        } catch (err) {
            console.error('❌ Error:', err.message);
        }
        conn.end();
    });

    conn.on('error', (err) => console.error('❌ Connection error:', err.message));
    conn.connect(SERVER);
}

run();
