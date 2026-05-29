const { Client } = require('ssh2');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' };

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

async function run() {
    console.log('Connecting to fleet server to get PM2 logs...');
    const conn = new Client();
    
    conn.on('ready', async () => {
        try {
            console.log('\n--- PM2 Status ---');
            let res = await execCommand(conn, 'pm2 list');
            console.log(res.stdout);
            
            console.log('\n--- PM2 Logs (main-site) ---');
            res = await execCommand(conn, 'pm2 logs main-site --lines 50 --nostream');
            console.log(res.stdout);
            if (res.stderr) console.error(res.stderr);

            console.log('\n--- PM2 Logs (n11) ---');
            res = await execCommand(conn, 'pm2 logs saas-app --lines 50 --nostream');
            console.log(res.stdout);
            if (res.stderr) console.error(res.stderr);

        } catch (err) {
            console.error('Error:', err);
        } finally {
            conn.end();
        }
    });

    conn.connect(SERVER);
}

run();
