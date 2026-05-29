const { Client } = require('ssh2');

function restore() {
    const conn = new Client();
    console.log('EMERGENCY: Restoring all PM2 production instances...');
    conn.on('ready', () => {
        conn.exec(`pm2 restart all`, (err, stream) => {
            if (err) throw err;
            stream.on('data', d => console.log(d.toString()));
            stream.on('close', code => {
                console.log(`Instances Restored. Exit code: ${code}`);
                conn.end();
            });
        });
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
}
restore();
