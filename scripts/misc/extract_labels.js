const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    // Extract actual sidebar labels from the 50eeb4eb chunk
    conn.exec(`
        grep -oE '"[a-z]+\\.[a-z_]+":"[^"]{2,60}"' /www/wwwroot/n2.namainvist.com/.next/server/chunks/ssr/src_components_50eeb4eb._.js 2>/dev/null | grep -E "dashboard|sales|purchases|inventory" | head -20
    `, (e, s) => {
        let d = '';
        s.on('data', x => d += x);
        s.on('close', () => {
            console.log('LABELS in 50eeb4eb:\n', d || 'NOT FOUND PATTERN');
            
            // Also check what layout the dashboard uses  
            conn.exec(`cat /www/wwwroot/n2.namainvist.com/src/app/\\(dashboard\\)/layout.tsx 2>/dev/null | head -30`, (e2, s2) => {
                let d2 = '';
                s2.on('data', x => d2 += x);
                s2.on('close', () => {
                    console.log('DASHBOARD LAYOUT:\n', d2);
                    
                    // What static chunk is referenced for sidebar?
                    conn.exec(`grep -rl "s\\.dashboard" /www/wwwroot/n2.namainvist.com/.next/static/ 2>/dev/null | head -5`, (e3, s3) => {
                        let d3 = '';
                        s3.on('data', x => d3 += x);
                        s3.on('close', () => {
                            console.log('Static chunks with s.dashboard:\n', d3);
                            
                            // Get actual content of the static chunk 
                            conn.exec(`grep -oE '"s\\.(dashboard|purchases|sales|inventory)"' /www/wwwroot/n2.namainvist.com/.next/static/chunks/ea656f0c9fd98050.js 2>/dev/null | head -5`, (e4, s4) => {
                                let d4 = '';
                                s4.on('data', x => d4 += x);
                                s4.on('close', () => {
                                    console.log('Static ea656 chunk:\n', d4);
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
