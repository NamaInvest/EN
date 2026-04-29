const { Client } = require('ssh2');
const config = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 60000 };

const conn = new Client();
conn.on('ready', () => {
    // Get ALL chunks and search them ALL
    conn.exec("find /www/wwwroot/namainvist.com/.next -name '*.js' | xargs grep -l 'sys\\.str_9' 2>/dev/null | head -10", (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.on('close', () => {
            console.log('ALL .next JS files with sys.str_9:');
            console.log(out || '(NONE - COMPLETELY CLEAN!)');
            
            // Also check if there's a DIFFERENT next app running
            conn.exec("pm2 list | grep nama", (err2, stream2) => {
                let out2 = '';
                stream2.on('data', d => out2 += d.toString());
                stream2.on('close', () => {
                    console.log('\nPM2 nama processes:');
                    console.log(out2);
                    
                    // Check what port 2999 is actually serving
                    conn.exec("ss -tlnp | grep 2999", (err3, stream3) => {
                        let out3 = '';
                        stream3.on('data', d => out3 += d.toString());
                        stream3.on('close', () => {
                            console.log('\nPort 2999 process:');
                            console.log(out3);
                            conn.end();
                        });
                    });
                });
            });
        });
    });
}).on('error', console.error).connect(config);
