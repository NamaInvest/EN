const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  conn.exec('pm2 jlist', (err, stream) => {
    if (err) throw err;
    let output = '';
    stream.on('data', d => output += d);
    stream.on('close', () => {
        try {
            const apps = JSON.parse(output);
            apps.forEach(app => console.log(app.name, app.pm2_env.pm_cwd));
        } catch(e) { console.log("Output:", output.substring(0, 500)); }
        conn.end();
    });
  });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
