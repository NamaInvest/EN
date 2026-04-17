const { Client } = require('ssh2');
const path = require('path');

const conn = new Client();
const APP = '/www/wwwroot/namainvist.com';

const files = [
    'src/middleware.ts',
    'src/app/company-info/page.tsx',
    'src/app/api/tenant/provision/route.ts',
    'src/app/api/tenant/check-status/route.ts',
];

conn.on('ready', () => {
    console.log('✅ متصل - رفع الملفات...');

    // Create all required directories
    const dirs = [...new Set(files.map(f => path.posix.dirname(f)))];
    const mkdirCmd = dirs.map(d => `mkdir -p ${APP}/${d}`).join(' && ');

    conn.exec(mkdirCmd, (err, stream) => {
        if (err) throw err;
        stream.resume();
        stream.on('close', () => {
            conn.sftp((err, sftp) => {
                if (err) throw err;
                let done = 0;
                files.forEach(f => {
                    sftp.fastPut(path.join(__dirname, f), `${APP}/${f}`, (err) => {
                        if (err) console.log(`❌ ${f}: ${err.message}`);
                        else console.log(`📤 ${f}`);
                        done++;
                        if (done === files.length) {
                            console.log('\n⏳ بناء main-site...');
                            conn.exec(`cd ${APP} && npm run build 2>&1 | tail -8 && pm2 restart main-site && echo "DONE"`, (err, stream2) => {
                                stream2.on('data', d => process.stdout.write(d.toString()));
                                stream2.stderr.on('data', d => process.stderr.write(d.toString()));
                                stream2.on('close', () => { conn.end(); });
                            });
                        }
                    });
                });
            });
        });
    });
}).connect({
    host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000
});
