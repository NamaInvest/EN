const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    const bashScript = `
#!/bin/bash
chattr -i /www/server/panel/vhost/nginx/namainvist.com.conf
# Remove the custom config so AaPanel can regenerate it cleanly if needed
# We will just leave it unlocked so the user can overwrite it via GUI
    `;
    conn.exec(bashScript, (execErr, stream) => {
        stream.on('close', () => { conn.end(); });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 15000 });
