const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('[🚀] Connected. Checking what Arabic text is in pre-rendered HTML...');
    
    // First, see what Arabic sidebar text is baked into purchases.html
    conn.exec(`grep -o "المشترياتة[^<\"]*\\|طلبات الشراء[^<\"]*" /www/wwwroot/n2.namainvist.com/.next/server/app/purchases.html 2>/dev/null | head -5`, (e, s) => {
        let d = '';
        s.on('data', x => d += x);
        s.on('close', () => {
            console.log('Arabics in purchases.html:', d || 'NOT FOUND IN HTML');
            
            // Check which SSR chunk is referenced by the HTML
            conn.exec(`grep -oE "_next/static/chunks/[^\"']+\\.js" /www/wwwroot/n2.namainvist.com/.next/server/app/purchases.html 2>/dev/null | head -10`, (e2, s2) => {
                let d2 = '';
                s2.on('data', x => d2 += x);
                s2.on('close', () => {
                    console.log('JS chunks referenced in purchases.html:', d2 || 'NONE');
                    
                    // Check the RSC payload (React Server Components) for sidebar
                    conn.exec(`head -c 1000 /www/wwwroot/n2.namainvist.com/.next/server/app/purchases.rsc 2>/dev/null | strings | grep -oE ".{0,20}(المشتر|sidebar|Sidebar).{0,20}" | head -5`, (e3, s3) => {
                        let d3 = '';
                        s3.on('data', x => d3 += x);
                        s3.on('close', () => {
                            console.log('RSC Arabic:', d3 || 'NONE IN RSC');
                            conn.end();
                        });
                    });
                });
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
