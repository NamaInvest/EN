const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(
        'curl -s "http://127.0.0.1:3500/api/tenant/check-status?userId=user_3CVlTU5PDDyb3Ofw8aJFXYOuNFs&email=ialqrashi62@gmail.com" -H "Host: namainvist.com" 2>/dev/null',
        (err, stream) => {
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.stderr.on('data', d => process.stderr.write(d.toString()));
            stream.on('close', () => {
                console.log('\n✅ check-status test done');
                conn.end();
            });
        }
    );
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
