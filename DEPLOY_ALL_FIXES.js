const { Client } = require('ssh2');
const fs = require('fs');

const c = new Client();
c.on('ready', () => {
    c.sftp((err, sftp) => {
        if (err) throw err;

        const uploads = [
            ['src/lib/translations.ts', '/www/wwwroot/n11.namainvist.com/src/lib/translations.ts'],
            ['src/lib/i18n.tsx', '/www/wwwroot/n11.namainvist.com/src/lib/i18n.tsx'],
            ['src/app/(dashboard)/settings/page.tsx', '/www/wwwroot/n11.namainvist.com/src/app/(dashboard)/settings/page.tsx'],
            ['src/locales/ar.json', '/www/wwwroot/n11.namainvist.com/src/locales/ar.json'],
            ['src/locales/en.json', '/www/wwwroot/n11.namainvist.com/src/locales/en.json'],
        ];

        let done = 0;
        for (const [src, dst] of uploads) {
            sftp.fastPut(src, dst, (err) => {
                if (err) console.error('Upload failed:', src, err?.message);
                else console.log('✅ Uploaded:', src);
                done++;
                if (done === uploads.length) {
                    // Clean debug page, remove hi/ur/bn locales, rebuild
                    c.exec([
                        'rm -rf /www/wwwroot/n11.namainvist.com/src/app/debug_i18n',
                        'rm -f /www/wwwroot/n11.namainvist.com/src/locales/hi.json',
                        'rm -f /www/wwwroot/n11.namainvist.com/src/locales/ur.json',
                        'rm -f /www/wwwroot/n11.namainvist.com/src/locales/bn.json',
                        'cd /www/wwwroot/n11.namainvist.com && npm run build && pm2 restart n11',
                        'echo "ALL DONE"'
                    ].join(' && '), (err3, stream) => {
                        if (err3) { console.error(err3); c.end(); return; }
                        stream.on('data', d => process.stdout.write(d.toString()));
                        stream.stderr.on('data', d => process.stderr.write(d.toString()));
                        stream.on('close', () => {
                            console.log('\n✅ Complete!');
                            c.end();
                        });
                    });
                }
            });
        }
    });
}).connect({host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b', readyTimeout:30000});
