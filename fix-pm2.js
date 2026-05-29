const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmd = `
        sed -i "s/args: 'start -p 3000'/args: 'start'/g" /www/wwwroot/namainvist.com/ecosystem.config.js &&
        sed -i "s/args: 'start -p 3001'/args: 'start'/g" /www/wwwroot/namainvist.com/ecosystem.config.js &&
        sed -i "s/args: 'start -p 3500'/args: 'start'/g" /www/wwwroot/namainvist.com/ecosystem.config.js &&
        sed -i "s/args: 'start -p 3600'/args: 'start'/g" /www/wwwroot/namainvist.com/ecosystem.config.js &&
        cd /www/wwwroot/namainvist.com && pm2 restart ecosystem.config.js --update-env
    `;
    conn.exec(cmd, (err, stream) => {
        stream.on('data', d => process.stdout.write(d));
        stream.on('close', () => conn.end());
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD'});
