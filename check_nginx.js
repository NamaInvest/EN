const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  conn.exec('cat /www/server/panel/vhost/nginx/*.conf', (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', d => out += d);
    stream.on('close', () => {
        // Filter out irrelevant lines to just see server_name and proxy_pass
        const lines = out.split('\n');
        lines.forEach(l => {
            if (l.includes('server_name') || l.includes('proxy_pass') || l.includes('listen')) {
                console.log(l.trim());
            }
        });
        conn.end();
    });
  });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
