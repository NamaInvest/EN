const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
    c.exec('grep -rl "Company Info" /www/wwwroot/n11.namainvist.com/.next/static/chunks', (err, stream) => {
        stream.on('data', d => console.log('Chunk with Company Info:', d.toString()));
        stream.on('close', () => c.end());
    });
}).connect({host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b', readyTimeout:30000});
