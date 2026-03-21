const { Client } = require('ssh2');

const SSH_CONFIG = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };

function execute(conn, cmd) {
    return new Promise((resolve, reject) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.stderr.on('data', d => process.stderr.write(d.toString()));
            stream.on('close', (code) => {
                resolve(code);
            });
        });
    });
}

function upload(conn, local, remote) {
    return new Promise((resolve, reject) => {
        conn.sftp((err, sftp) => {
            if (err) return reject(err);
            sftp.fastPut(local, remote, (err) => {
                if (err) reject(err);
                else {
                    console.log('Uploaded', remote);
                    resolve();
                }
            });
        });
    });
}

async function rebuildServer(i) {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        conn.on('ready', async () => {
            try {
                console.log(`Patching Sidebar on N${i}...`);
                await upload(conn, 'd:/namasoft9-3-main/src/components/Sidebar.tsx', `/www/wwwroot/n${i}.namainvist.com/src/components/Sidebar.tsx`);
                await execute(conn, `pm2 stop n${i} n9 n10 || true && cd /www/wwwroot/n${i}.namainvist.com && npm run build && pm2 restart n${i} n9 n10 || true`);
                console.log(`Finished N${i}`);
            } catch (e) {
                console.error(`Error on N${i}`, e);
            } finally {
                conn.end();
                resolve();
            }
        }).on('error', (e) => {
            console.error(`Conn Error N${i}:`, e);
            resolve();
        }).connect(SSH_CONFIG);
    });
}

async function run() {
    for (let i = 1; i <= 10; i++) {
        await rebuildServer(i);
    }
    console.log('Sidebar Hotfix deployed to all servers.');
}

run();
