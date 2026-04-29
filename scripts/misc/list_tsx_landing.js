const { Client } = require('ssh2');
const config = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 60000 };

const conn = new Client();
conn.on('ready', () => {
    // Get ALL tsx components on namainvist.com server
    conn.exec("find /www/wwwroot/namainvist.com/src -name '*.tsx' | head -30", (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.on('close', () => {
            console.log('ALL TSX FILES on namainvist.com:');
            console.log(out);
            
            // Also check components folder
            conn.exec("ls /www/wwwroot/namainvist.com/src/components/", (err2, stream2) => {
                let out2 = '';
                stream2.on('data', d => out2 += d.toString());
                stream2.on('close', () => {
                    console.log('\nCOMPONENTS:');
                    console.log(out2);
                    conn.end();
                });
            });
        });
    });
}).on('error', console.error).connect(config);
