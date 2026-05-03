const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('pm2 jlist', (err, stream) => {
        if (err) throw err;
        let data = '';
        stream.on('data', d => data += d);
        stream.on('close', () => {
            const list = JSON.parse(data);
            const wildcardApp = list.find(p => p.pm2_env.PORT === 3500 || (p.pm2_env.env && p.pm2_env.env.PORT === 3500) || (p.pm2_env.env_production && p.pm2_env.env_production.PORT == 3500));
            if (wildcardApp) {
                console.log(`Port 3500 app: ${wildcardApp.name} at ${wildcardApp.pm2_env.pm_cwd}`);
            } else {
                console.log('No app found running explicitly on port 3500 in pm2 jlist. Let me print all ports:');
                list.forEach(p => {
                    const port = p.pm2_env.PORT || (p.pm2_env.env && p.pm2_env.env.PORT) || 'unknown';
                    console.log(`${p.name}: port ${port} at ${p.pm2_env.pm_cwd}`);
                });
            }
            conn.end();
        });
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
});
