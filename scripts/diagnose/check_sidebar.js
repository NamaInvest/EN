const { Client } = require('ssh2');
const config = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 60000 };

const conn = new Client();
conn.on('ready', () => {
    conn.exec("cat /www/wwwroot/namainvist.com/src/components/Sidebar.tsx | base64", (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.on('close', () => {
            const decoded = Buffer.from(out, 'base64').toString('utf8');
            // Find sys.str mentions
            const matches = [...decoded.matchAll(/sys\.str_\d+/g)];
            if (matches.length > 0) {
                console.log('FOUND sys.str in Sidebar.tsx! Count:', matches.length);
                // print unique ones
                const unique = [...new Set(matches.map(m => m[0]))].slice(0, 20);
                console.log('Unique keys:', unique);
            } else {
                console.log('Sidebar.tsx is CLEAN');
            }
            console.log('\nFirst 500 chars:');
            console.log(decoded.substring(0, 500));
            conn.end();
        });
    });
}).on('error', console.error).connect(config);
