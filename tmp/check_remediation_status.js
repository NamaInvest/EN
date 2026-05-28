const { Client } = require('ssh2');

const SERVER = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
};

const conn = new Client();

conn.on('ready', () => {
    // Check files in the backup directory and in the root directory
    const cmd = `
        echo "=== BACKUP DIRECTORY FILES ===" && ls -l /www/wwwroot/namainvist.com/backups/legacy-root-files && \
        echo "=== ROOT DIRECTORY TS FILES ===" && find /www/wwwroot/namainvist.com -maxdepth 1 -name "*.ts" && \
        echo "=== NPM LIST GPT-TOKENIZER ===" && cd /www/wwwroot/namainvist.com && npm list gpt-tokenizer
    `;
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => { out += d.toString(); });
        stream.on('close', () => {
            console.log(out);
            conn.end();
        });
    });
}).connect(SERVER);
