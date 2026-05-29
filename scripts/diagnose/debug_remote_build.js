const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('pm2 jlist', (err, stream) => {
        let output = '';
        stream.on('data', d => output += d);
        stream.on('close', () => {
            let plist = JSON.parse(output.substring(output.indexOf('['), output.lastIndexOf(']')+1));
            let n1 = plist.find(p => p.name === 'n1');
            conn.exec(`cd ${n1.pm2_env.pm_cwd} && npm run build`, (err, execStream) => {
                execStream.on('close', (code) => {
                    console.log('Stream :: close :: code: ' + code);
                    conn.end();
                }).on('data', d => process.stdout.write(d))
                  .stderr.on('data', d => process.stderr.write(d));
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
