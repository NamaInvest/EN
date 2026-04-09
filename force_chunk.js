const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
    c.exec('cd /www/wwwroot/n11.namainvist.com && echo "// FORCE CHUNK UPDATE 2" >> src/app/(dashboard)/settings/page.tsx && npm run build && pm2 restart n11', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => c.end());
    });
}).connect({host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b', readyTimeout:30000});
