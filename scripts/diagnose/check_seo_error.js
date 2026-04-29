const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('--- FETCHING SEO COMPILER ERRORS ON N1 ---');
    const cmd = `
        cd /www/wwwroot/n1.namainvist.com
        npm run build
    `;
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => console.log(d.toString()));
        stream.stderr.on('data', d => console.error(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
