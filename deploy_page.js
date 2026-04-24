const { Client } = require('ssh2');
const path = require('path');

const conn = new Client();
const APP = '/www/wwwroot/namainvist.com';

const files = [
    { local: 'src/app/page.tsx', remote: 'src/app/page.tsx' }
];

conn.on('ready', () => {
    console.log('✅ متصل - يتم رفع page.tsx...');

    conn.sftp((err, sftp) => {
        if (err) throw err;
        let done = 0;
        files.forEach(f => {
            sftp.fastPut(path.join(__dirname, f.local), `${APP}/${f.remote}`, (err) => {
                if (err) console.log(`\n❌ ${f.local}: ${err.message}`);
                else console.log(`\n✅ ${f.local} -> ${f.remote}`);
                done++;
                if (done === files.length) {
                    console.log('\n⏳ تحديث وبناء الصفحة الرئيسية (main-site)...');
                    conn.exec(`cd ${APP} && npm run build 2>&1 | tail -8 && pm2 restart main-site && echo "DONE"`, (err, stream2) => {
                        stream2.on('data', d => process.stdout.write(d.toString()));
                        stream2.stderr.on('data', d => process.stderr.write(d.toString()));
                        stream2.on('close', () => { conn.end(); });
                    });
                }
            });
        });
    });
}).connect({
    host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000
});
