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
    const conn = new Client();
    conn.on('ready', async () => {
        try {
            console.log('Granting privileges on namadb to namadb user...');
            await execCommand(conn, 'sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO namadb;" namadb');
            await execCommand(conn, 'sudo -u postgres psql -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO namadb;" namadb');

            console.log('Granting privileges on n1_db to n1_db user...');
            await execCommand(conn, 'sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO n1_db;" n1_db');
            await execCommand(conn, 'sudo -u postgres psql -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO n1_db;" n1_db');

            console.log('Granting privileges on n11_db to n11_db user...');
            await execCommand(conn, 'sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO n11_db;" n11_db');
            await execCommand(conn, 'sudo -u postgres psql -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO n11_db;" n11_db');

            console.log('Done!');
        } catch (err) {
            console.error(err);
        }
        conn.end();
    });
    conn.connect(SERVER);
}

run();
