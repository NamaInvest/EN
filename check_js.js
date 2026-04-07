const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    // Check 1: what does curl return from N2
    conn.exec('curl -s http://localhost:3002/dashboard 2>/dev/null | grep -c "Dashboard\|dashboard"', (e, s) => {
        let d = '';
        s.on('data', x => d += x);
        s.on('close', () => {
            console.log('Curl dashboard matches:', d.trim());
            
            // Check 2: Does the built JS contain our new s.dashboard key?
            conn.exec('grep -rl "s.dashboard" /www/wwwroot/n2.namainvist.com/.next/static/chunks/ 2>/dev/null', (e2, s2) => {
                let d2 = '';
                s2.on('data', x => d2 += x);
                s2.on('close', () => {
                    console.log('Chunks with s.dashboard:', d2.trim() || 'NONE!');
                    
                    // Check 3: Does the built JS contain old labels?
                    conn.exec('grep -rl "Purchases" /www/wwwroot/n2.namainvist.com/.next/static/chunks/ 2>/dev/null | head -3', (e3, s3) => {
                        let d3 = '';
                        s3.on('data', x => d3 += x);
                        s3.on('close', () => {
                            console.log('Chunks with English labels:', d3.trim() || 'NONE');
                            
                            // Check 4: what does the Sidebar chunk contain?
                            conn.exec('ls -lt /www/wwwroot/n2.namainvist.com/.next/static/chunks/ | head -10', (e4, s4) => {
                                let d4 = '';
                                s4.on('data', x => d4 += x);
                                s4.on('close', () => {
                                    console.log('Chunks (newest):\n', d4);
                                    conn.end();
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
