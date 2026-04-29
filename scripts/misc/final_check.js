const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    conn.exec(`ls /www/wwwroot/n2.namainvist.com/.next/server/app/`, (e, s) => {
        let d = '';
        s.on('data', x => d += x);
        s.on('close', () => {
            console.log('App dir:\n', d);

            conn.exec(`cat /www/wwwroot/n2.namainvist.com/.next/server/app/loyalty.html | wc -c`, (e2, s2) => {
                let d2 = '';
                s2.on('data', x => d2 += x);
                s2.on('close', () => {
                    console.log('loyalty.html size:', d2.trim());

                    // Check if sidebar Arabic exists in any prerendered HTML
                    conn.exec(`grep -rl "المشتريات" /www/wwwroot/n2.namainvist.com/.next/server/app/ 2>/dev/null | head -5`, (e3, s3) => {
                        let d3 = '';
                        s3.on('data', x => d3 += x);
                        s3.on('close', () => {
                            console.log('HTMLs with Arabic sidebar:', d3.trim() || 'NONE');

                            // Final check - what does the built SSR bundle say about Sidebar
                            conn.exec(`grep -o "s\\.dashboard[^'\"]{0,50}" /www/wwwroot/n2.namainvist.com/.next/server/chunks/ssr/src_components_50eeb4eb._.js 2>/dev/null | head -5`, (e4, s4) => {
                                let d4 = '';
                                s4.on('data', x => d4 += x);
                                s4.on('close', () => {
                                    console.log('SSR chunk s.dashboard:', d4.trim() || 'NONE');
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
