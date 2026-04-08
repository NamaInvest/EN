const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const file = 'src/components/ThemeSwitcher.tsx';
        sftp.fastPut(file, `/www/wwwroot/n1.namainvist.com/${file}`, (err1) => {
            console.log('ThemeSwitcher fixed. Rebuilding...');
            conn.exec('cd /www/wwwroot/n1.namainvist.com && npm run build && fuser -k 3001/tcp ; pm2 restart nama-main', (err, stream) => {
                stream.on('data', d => process.stdout.write(d)).stderr.on('data', d => process.stderr.write(d)).on('close', (c) => {
                    console.log(`Done! Exit code: ${c}`);
                    conn.end();
                });
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
