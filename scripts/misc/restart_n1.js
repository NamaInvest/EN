const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    console.log('✅ SSH Connected');

    // First get pm2 list to find correct process name
    conn.exec(`pm2 list --no-color`, (err, stream) => {
        if (err) { console.error(err); conn.end(); return; }
        let out = '';
        stream.on('data', d => { out += d.toString(); process.stdout.write(d); });
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => {
            // Try to restart known process names
            const restartCmd = `cd /www/wwwroot/n1.namainvist.com && (pm2 restart n11 || pm2 restart "n1" || pm2 restart nama-main || pm2 start node_modules/next/dist/bin/next --name "n1-main" -- start -p 3011) && pm2 save && echo "RESTARTED_OK"`;
            conn.exec(restartCmd, (err2, stream2) => {
                if (err2) { console.error(err2); conn.end(); return; }
                stream2.on('data', d => process.stdout.write(d));
                stream2.stderr.on('data', d => process.stderr.write(d));
                stream2.on('close', () => {
                    console.log('\n✅ Done!');
                    conn.end();
                });
            });
        });
    });
}).on('error', err => {
    console.error('SSH error:', err.message);
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: 'process.env.SSH_PASSWORD',
    readyTimeout: 15000
});
