const { Client } = require('ssh2');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };

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
    const conn = new Client();
    
    conn.on('ready', async () => {
        try {
            console.log('Running build on main-site...');
            let res = await execCommand(conn, 'cd /www/wwwroot/namainvist.com && npm run build');
            console.log('Exit code:', res.code);
            console.log('Stdout:\n', res.stdout);
            console.log('Stderr:\n', res.stderr);

        } catch (err) {
            console.error('Error:', err);
        } finally {
            conn.end();
        }
    });

    conn.connect(SERVER);
}

run();
