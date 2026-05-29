const { Client } = require('ssh2');

function buildN1() {
    const conn = new Client();
    console.log('[n1] Initiating SAFE build...');
    conn.on('ready', () => {
        // Free up RAM by stopping PM2 before building Next.js
        const cmd = `cd /www/wwwroot/n1.namainvist.com && pm2 stop all && npm run build && pm2 restart all`;
        conn.exec(cmd, (err, stream) => {
            if (err) throw err;
            stream.on('data', d => console.log('STDOUT:', d.toString()));
            stream.stderr.on('data', d => console.error('STDERR:', d.toString()));
            stream.on('close', code => {
                console.log(`[n1] SAFE Build complete. Exit code: ${code}`);
                conn.end();
            });
        });
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
}

buildN1();
