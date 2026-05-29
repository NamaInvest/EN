const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    // Need a clean output - run separate commands
    conn.exec('pm2 list --no-color 2>&1 | cat', (err, stream) => {
        let d = '';
        stream.on('data', x => d += x);
        stream.on('close', () => {
            console.log('=== PM2 PROCS ===\n', d);
            
            conn.exec('ss -tlnp 2>&1 | grep next | cat', (e2, s2) => {
                let d2 = '';
                s2.on('data', x => d2 += x);
                s2.on('close', () => {
                    console.log('=== PORTS ===\n', d2);
                    
                    conn.exec('cat /www/server/nginx/vhost/n2.namainvist.com.conf 2>&1', (e3, s3) => {
                        let d3 = '';
                        s3.on('data', x => d3 += x);
                        s3.on('close', () => {
                            console.log('=== NGINX ===\n', d3);
                            
                            conn.exec("grep PORT /www/wwwroot/n2.namainvist.com/.env 2>&1", (e4, s4) => {
                                let d4 = '';
                                s4.on('data', x => d4 += x);
                                s4.on('close', () => {
                                    console.log('=== ENV PORT ===\n', d4);
                                    conn.end();
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
