const { Client } = require('ssh2');
const config = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 60000 };

const conn = new Client();
conn.on('ready', () => {
    // Check when .next was last built
    conn.exec("ls -la /www/wwwroot/namainvist.com/.next/BUILD_ID 2>&1 && cat /www/wwwroot/namainvist.com/.next/BUILD_ID", (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.on('close', () => {
            console.log('BUILD ID info:');
            console.log(out);
            
            // check if build is still running
            conn.exec("cat /www/wwwroot/nama_landing_fix.log | tail -20", (err2, stream2) => {
                let out2 = '';
                stream2.on('data', d => out2 += d.toString());
                stream2.on('close', () => {
                    console.log('\nLAST BUILD LOG:');
                    console.log(out2);
                    conn.end();
                });
            });
        });
    });
}).on('error', console.error).connect(config);
