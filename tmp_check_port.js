const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    conn.exec('pm2 jlist', (err, stream) => {
        let output = '';
        stream.on('data', d => output += d);
        stream.on('close', () => {
            try {
                const jsonStart = output.indexOf('[');
                const jsonEnd = output.lastIndexOf(']') + 1;
                const processes = JSON.parse(output.substring(jsonStart, jsonEnd));
                const n2 = processes.find(p => p.name === 'n2');
                console.log('n2 env:', JSON.stringify(n2.pm2_env, null, 2));
            } catch(e) {
                console.log('Error parsing JSON');
            }
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
