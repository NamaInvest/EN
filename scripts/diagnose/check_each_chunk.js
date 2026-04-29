const { Client } = require('ssh2');
const config = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 60000 };

const chunks = [
    '1627bf2f54f2038d.js',
    'f2f58a7e93290fbb.js',
    '4ca88780337b602d.js',
    'turbopack-b7330beb2ef20bce.js',
    '2935d72114609181.js',
    'e74330338913d082.js',
    '2f236954d6a65e12.js',
    '85d18eb28373e254.js',
    'a6dad97d9634a72d.js',
    '06fbd27bd016a998.js'
];

const conn = new Client();
conn.on('ready', () => {
    let pending = chunks.length;
    const found = [];
    
    chunks.forEach(chunk => {
        const path = `/www/wwwroot/namainvist.com/.next/static/chunks/${chunk}`;
        conn.exec(`grep -o 'sys\\.str_[0-9]*' "${path}" 2>/dev/null | sort -u | head -10`, (err, stream) => {
            if (err) { pending--; if (pending === 0) { console.log('Results:', found); conn.end(); } return; }
            let out = '';
            stream.on('data', d => out += d.toString());
            stream.on('close', () => {
                if (out.trim()) {
                    found.push({ chunk, keys: out.trim().split('\n') });
                    console.log(`FOUND in ${chunk}:`, out.trim());
                }
                pending--;
                if (pending === 0) {
                    if (found.length === 0) console.log('ALL CLEAN - no sys.str in any chunk!');
                    conn.end();
                }
            });
        });
    });
}).on('error', console.error).connect(config);
