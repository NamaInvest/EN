const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec("sudo -u postgres psql -d nmaawill_db -c 'SELECT key, value FROM \"Setting\";'", (err, stream) => {
        let output = '';
        stream.on('data', d => { output += d.toString(); process.stdout.write(d.toString()); });
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => {
            console.log("\nFinished querying.");
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
