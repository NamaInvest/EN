const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected via SSH. Running curl...');
    conn.exec('curl -s -b "app_lang=en" http://127.0.0.1:3001/dashboard', (err, stream) => {
        if (err) throw err;
        let data = '';
        stream.on('data', chunk => data += chunk.toString());
        stream.on('close', () => {
            // Check what the sidebar looks like
            if (data.includes('Dashboard')) {
                console.log('✅ ENGLISH DETECTED [Dashboard]');
            } else if (data.includes('الرئيسية')) {
                console.log('❌ ARABIC DETECTED [الرئيسية]');
            }
            
            if (data.includes('dir="ltr"')) {
                console.log('✅ DIRECTION LTR DETECTED');
            } else {
                console.log('❌ DIRECTION RTL DETECTED');
            }
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
