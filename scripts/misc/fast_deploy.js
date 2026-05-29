const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        console.log('Uploading translations.ts...');
        sftp.fastPut('src/lib/translations.ts', '/www/wwwroot/n1.namainvist.com/src/lib/translations.ts', () => {
            console.log('Upload complete, triggering build (this takes ~4-5 secs)...');
            const buildCmd = 'export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh" && nvm use 24 && cd /www/wwwroot/n1.namainvist.com && npm run build > build_lang.log 2>&1 && pm2 restart nama-main && echo "RESTART FINISHED"';
            conn.exec(buildCmd, (err, stream) => {
                if (err) throw err;
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.on('close', () => conn.end());
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
