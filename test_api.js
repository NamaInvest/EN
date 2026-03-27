const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    conn.exec(`node -e "(async () => { try { const r = await fetch('http://localhost:3001/api/settings/test_metric', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value: '123' }) }); console.log('STATUS:', r.status, 'BODY:', await r.text()); } catch(e) { console.error(e); } })()"`, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end()).on('data', data => console.log(data.toString())).stderr.on('data', data => console.error(data.toString()));
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
