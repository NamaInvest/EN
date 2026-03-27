const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    conn.exec(`node -e "(async () => {
        try {
            const token = ''; // We'll just test if it hits auth or what
            const payload = { test1: '123', branch_name_en: 'Riyadh' };
            const r = await fetch('http://localhost:3001/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            console.log('STATUS:', r.status);
            console.log('BODY:', await r.text());
        } catch(e) { console.error(e); }
    })()"`, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end()).on('data', data => console.log(data.toString()));
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
