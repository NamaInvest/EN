const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('--- FETCHING PM2 ERROR LOGS ---');
    
    // Check logs for n1 which usually serves the main domain or whatever is crashing
    const bashScript = `
pm2 logs --lines 50 --err --nostream
    `;
    
    conn.exec(bashScript, (execErr, stream) => {
        if (execErr) throw execErr;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => {
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
