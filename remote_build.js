const { Client } = require('ssh2');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };

const conn = new Client();
conn.on('ready', () => {
    console.log('✅ Connected! Running npm run build...');
    
    // We execute the build and show the full output
    conn.exec('cd /www/wwwroot/namainvist.com && npm run build', (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            console.log(`\nBuild process exited with code ${code}`);
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data.toString());
        }).stderr.on('data', (data) => {
            process.stderr.write(data.toString());
        });
    });
}).connect(SERVER);
