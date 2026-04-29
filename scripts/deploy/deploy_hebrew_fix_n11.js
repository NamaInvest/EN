const { Client } = require('ssh2');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    readyTimeout: 60000
};

const files = [
    { local: 'c:\\Users\\1\\Desktop\\alfa\\src\\locales\\ar.json', remote: '/www/wwwroot/n11.namainvist.com/src/locales/ar.json' },
    { local: 'c:\\Users\\1\\Desktop\\alfa\\src\\lib\\telegram-bot.ts', remote: '/www/wwwroot/n11.namainvist.com/src/lib/telegram-bot.ts' },
    { local: 'c:\\Users\\1\\Desktop\\alfa\\src\\app\\api\\zatca\\generate-request\\route.ts', remote: '/www/wwwroot/n11.namainvist.com/src/app/api/zatca/generate-request/route.ts' },
    { local: 'c:\\Users\\1\\Desktop\\alfa\\src\\app\\(dashboard)\\reports\\73-modules\\page.tsx', remote: '/www/wwwroot/n11.namainvist.com/src/app/(dashboard)/reports/73-modules/page.tsx' }
];

const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        let pending = files.length;
        files.forEach(f => {
            sftp.fastPut(f.local, f.remote, (err) => {
                if (err) throw err;
                console.log('Uploaded to N11:', f.remote);
                if (--pending === 0) {
                    console.log('All files uploaded to N11. Starting background build on N11...');
                    conn.exec('nohup sh -c "cd /www/wwwroot/n11.namainvist.com && npm run build && pm2 restart n11" > /www/wwwroot/n11_hebrew_fix.log 2>&1 &', (err, stream) => {
                        if (err) throw err;
                        console.log('Build script launched on N11.');
                        setTimeout(() => conn.end(), 1000);
                    });
                }
            });
        });
    });
}).on('error', console.error).connect(config);
