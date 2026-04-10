const { Client } = require('ssh2');

const c = new Client();
c.on('ready', () => {
    c.exec('curl -s http://127.0.0.1:3011/settings | grep -o ".\\{0,50\\}Hindi.\\{0,50\\}"', (err, s) => {
        let o = '';
        s.on('data', d => o += d.toString());
        s.on('close', () => {
            console.log("Direct Node.js Response:\n", o || "NO HINDI FROM DIRECT NODE!");
            c.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
