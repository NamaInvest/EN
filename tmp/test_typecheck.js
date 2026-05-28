const { Client } = require('ssh2');

const SERVER = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
};

const conn = new Client();

conn.on('ready', () => {
    conn.exec('cd /www/wwwroot/namainvist.com && npm run typecheck', (err, stream) => {
        if (err) throw err;
        let stdout = '', stderr = '';
        stream.on('data', d => { stdout += d.toString(); });
        stream.stderr.on('data', d => { stderr += d.toString(); });
        stream.on('close', (code) => {
            console.log(`Exit Code: ${code}`);
            console.log(`Stdout:\n${stdout}`);
            console.log(`Stderr:\n${stderr}`);
            conn.end();
        });
    });
}).connect(SERVER);
