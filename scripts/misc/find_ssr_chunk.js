const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    // Find which SSR chunk has sidebar code
    conn.exec(`
        ls /www/wwwroot/n2.namainvist.com/.next/server/chunks/ssr/ | grep "src_components" | head -10
    `, (e, s) => {
        let d = '';
        s.on('data', x => d += x);
        s.on('close', () => {
            console.log('SSR Components chunks:', d.trim());

            // Check if any SSR chunk has s.dashboard or s.purchases
            conn.exec(`grep -rl "s\\.dashboard" /www/wwwroot/n2.namainvist.com/.next/server/ 2>/dev/null | grep -v ".map" | head -5`, (e2, s2) => {
                let d2 = '';
                s2.on('data', x => d2 += x);
                s2.on('close', () => {
                    console.log('Server chunks with s.dashboard:', d2.trim() || 'ABSOLUTELY NONE - BUILD FAILED SILENTLY');
                    
                    // Check which chunk HAS sidebar code - look for s.sales
                    conn.exec(`grep -rl "المشتريات" /www/wwwroot/n2.namainvist.com/.next/server/ 2>/dev/null | grep -v ".map" | head -5`, (e3, s3) => {
                        let d3 = '';
                        s3.on('data', x => d3 += x);
                        s3.on('close', () => {
                            console.log('Server chunks with Arabic purchases:', d3.trim() || 'NONE');
                            
                            // Show what IS in src_components chunk
                            conn.exec(`head -c 500 /www/wwwroot/n2.namainvist.com/.next/server/chunks/ssr/src_components_50eeb4eb._.js 2>/dev/null`, (e4, s4) => {
                                let d4 = '';
                                s4.on('data', x => d4 += x);
                                s4.on('close', () => {
                                    console.log('CHUNK CONTENT START:\n', d4);
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
