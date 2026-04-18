const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    console.log('SSH Connected — running build...');
    conn.exec(
        'cd /www/wwwroot/n11.namainvist.com && npm run build 2>&1 && pm2 restart saas-app && echo "✅ BUILD_AND_RESTART_DONE"',
        { pty: false },
        (err, stream) => {
            if (err) throw err;
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.stderr.on('data', d => process.stderr.write(d.toString()));
            stream.on('close', (code) => {
                console.log('\nProcess exited with code:', code);
                conn.end();
            });
        }
    );
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 60000 });
