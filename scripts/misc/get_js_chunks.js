const { Client } = require('ssh2');
const config = { host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 60000 };

const conn = new Client();
conn.on('ready', () => {
    // Get the JS file that the browser ACTUALLY downloads and runs
    // First get the main page HTML to find which JS chunks are loading
    conn.exec("curl -s http://127.0.0.1:2999/ | grep -o 'src=\"/_next/static/chunks/[^\"]*\"' | head -20", (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.on('close', () => {
            console.log('JS CHUNKS loaded on main page:');
            console.log(out);
            conn.end();
        });
    });
}).on('error', console.error).connect(config);
