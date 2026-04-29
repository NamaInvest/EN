const { Client } = require('ssh2');
const config = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 60000 };

const conn = new Client();
conn.on('ready', () => {
    // check the STATIC html output cached by nextjs
    conn.exec("find /www/wwwroot/namainvist.com/.next -name '*.html' | xargs grep -l 'sys.str' 2>&1 | head -5", (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.on('close', () => {
            console.log('Static HTML files with sys.str:');
            console.log(out || '(NONE - CLEAN!)');
            
            // Also check JS chunks
            conn.exec("find /www/wwwroot/namainvist.com/.next/static -name '*.js' | xargs grep -l 'sys.str' 2>&1 | head -5", (err2, stream2) => {
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
