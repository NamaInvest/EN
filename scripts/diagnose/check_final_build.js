const { Client } = require('ssh2');
const config = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 60000 };

const conn = new Client();
conn.on('ready', () => {
    conn.exec("cat /www/wwwroot/namainvist.com/.next/BUILD_ID && echo '' && ls -la /www/wwwroot/namainvist.com/.next/", (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.on('close', () => {
            console.log('Build info:');
            console.log(out.substring(0, 1000));
            
            // Also check if any JS chunk contains sys.str
            conn.exec("grep -rl 'sys.str' /www/wwwroot/namainvist.com/.next/static/chunks/ 2>/dev/null | head -5", (err2, stream2) => {
                let out2 = '';
                stream2.on('data', d => out2 += d.toString());
                stream2.on('close', () => {
                    console.log('\nJS chunks with sys.str:');
                    console.log(out2 || '(NONE - CLEAN!)');
                    conn.end();
                });
            });
        });
    });
}).on('error', console.error).connect(config);
