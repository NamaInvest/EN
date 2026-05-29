const { Client } = require('ssh2');
const fs = require('fs');

const c = new Client();
c.on('ready', () => {
    // Clean up test files we created earlier
    c.exec('rm -rf /www/wwwroot/n11.namainvist.com/src/app/api/test_render_html /www/wwwroot/n11.namainvist.com/src/app/api/test_settings_direct /www/wwwroot/n11.namainvist.com/src/app/api/test_i18n /www/wwwroot/n11.namainvist.com/src/app/test_settings && echo "Cleaned test files"', (err, stream) => {
        stream.on('data', d => console.log(d.toString()));
        stream.on('close', () => {
            // Also remove the trailing comment we added to settings/page.tsx
            c.exec("sed -i '/FORCE CHUNK UPDATE/d' /www/wwwroot/n11.namainvist.com/src/app/\\(dashboard\\)/settings/page.tsx && echo 'Cleaned page'", (err2, stream2) => {
                stream2.on('data', d => console.log(d.toString()));
                stream2.on('close', () => {
                    // Now rebuild
                    c.exec('cd /www/wwwroot/n11.namainvist.com && npm run build && pm2 restart n11 && echo "BUILD AND RESTART COMPLETE"', (err3, stream3) => {
                        if (err3) { console.error(err3); c.end(); return; }
                        stream3.on('data', d => process.stdout.write(d.toString()));
                        stream3.stderr.on('data', d => process.stderr.write(d.toString()));
                        stream3.on('close', () => {
                            console.log('Build completed!');
                            c.end();
                        });
                    });
                });
            });
        });
    });
}).connect({host:'46.4.188.170', port:22, username:'root', password:'process.env.SSH_PASSWORD', readyTimeout:30000});
