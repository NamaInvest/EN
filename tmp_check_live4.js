const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    conn.exec('curl -s -b "app_lang=en; token=faketoken; session=1" http://127.0.0.1:3001/dashboard', (err, stream) => {
        if (err) throw err;
        let data = '';
        stream.on('data', chunk => data += chunk.toString());
        stream.on('close', () => {
            if (data.includes('لوحة التحكم')) {
                console.log('❌ ARABIC FOUND IN EN HTML');
            } else if (data.includes('Dashboard')) {
                console.log('✅ ENGLISH FOUND IN EN HTML');
            } else {
                console.log('❓ Neither found');
            }
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
