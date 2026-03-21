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

async function rebuildServer(i) {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        conn.on('ready', async () => {
            console.log(`Rebuilding safe N${i}...`);
            await execute(conn, `pm2 stop n${i} n9 n10 || true && cd /www/wwwroot/n${i}.namainvist.com && npm run build && pm2 restart n${i} n9 n10 || true`);
            console.log(`Finished N${i}`);
            conn.end();
            resolve();
        }).on('error', (e) => {
            console.error(`Error N${i}:`, e);
            resolve();
        }).connect(SSH_CONFIG);
    });
}

async function run() {
    for (let i = 2; i <= 10; i++) {
        await rebuildServer(i);
    }
    console.log('Safe N2-N10 rebuilds complete.');
}

run();
