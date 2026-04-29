const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    conn.exec('pm2 jlist', (err, stream) => {
        let output = '';
        if (err) throw err;
        stream.on('data', d => output += d.toString());
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => {
            try {
                const list = JSON.parse(output);
                const processes = list.map(p => ({
                    name: p.name,
                    status: p.pm2_env.status
                }));
                console.log(JSON.stringify(processes, null, 2));
            } catch(e) { console.log(e); }
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
