const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    console.log('--- REBUILDING NAMA-MAIN ON HETZNER TO CATCH ERRORS ---');
    conn.exec('cd /www/wwwroot/namainvist.com && npm run build', (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => {
            console.log('\n--- BUILD PROCESS ENDED ---');
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
