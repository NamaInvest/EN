const { Client } = require('ssh2');
const SSH_CONFIG = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 };

async function runCmd(conn, cmd) {
    return new Promise((resolve, reject) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            let out = '';
            stream.on('close', () => resolve(out))
                .on('data', d => { out += d; process.stdout.write(d.toString()); })
                .stderr.on('data', d => process.stderr.write(d.toString()));
        });
    });
}

async function main() {
    const conn = new Client();
    await new Promise((res, rej) => conn.on('ready', res).on('error', rej).connect(SSH_CONFIG));
    console.log('✅ Connected to Server!\n');
    console.log('--- PM2 STATUS ---\n');
    await runCmd(conn, `pm2 status n11`);
    console.log('\n--- PM2 LOGS FOR ALL NODES ---\n');
    for (let i = 1; i <= 11; i++) {
        console.log(`\n\n--- CHEKING n${i} ---`);
        await runCmd(conn, `tail -n 20 /root/.pm2/logs/n${i}-error.log`);
    }
    conn.end();
}

main().catch(console.error);
