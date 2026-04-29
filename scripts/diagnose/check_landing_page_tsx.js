const { Client } = require('ssh2');
const config = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 60000 };

const conn = new Client();
conn.on('ready', () => {
    conn.exec("cat /www/wwwroot/namainvist.com/src/app/page.tsx | base64", (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.on('close', () => {
            const decoded = Buffer.from(out, 'base64').toString('utf8');
            // look for sys.str in the decoded content
            const matches = [...decoded.matchAll(/sys\.str_\d+/g)];
            if (matches.length > 0) {
                console.log('FOUND sys.str KEYS IN SERVER page.tsx:');
                matches.forEach(m => console.log(' -', m[0], 'at index', m.index));
            } else {
                console.log('NO sys.str in server page.tsx - file is CLEAN');
            }
            // Also print first 200 chars to verify which file version it is
            console.log('\nFirst 300 chars of server page.tsx:');
            console.log(decoded.substring(0, 300));
            conn.end();
        });
    });
}).on('error', console.error).connect(config);
