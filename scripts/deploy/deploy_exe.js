const { Client } = require('ssh2');
const path = require('path');

const conn = new Client();
const APP = '/www/wwwroot/namainvist.com';

const files = [
    { local: 'src/app/page.tsx', remote: 'src/app/page.tsx' },
    { local: 'dist-electron/NamaInvest-Setup-2.4.1.exe', remote: 'public/updates/desktop/NamaInvest-Setup-2.4.1.exe' }
];

conn.on('ready', () => {
    console.log('✅ متصل - يتم رفع ملف التحميل والواجهة الرئيسية (قد يستغرق 3-5 دقائق)...');

    // Create required directories on the server
    const dirs = [...new Set(files.map(f => path.posix.dirname(f.remote)))];
    const mkdirCmd = dirs.map(d => `mkdir -p "${APP}/${d}"`).join(' && ');

    conn.exec(mkdirCmd, (err, stream) => {
        if (err) throw err;
        stream.resume();
        stream.on('close', () => {
            conn.sftp((err, sftp) => {
                if (err) throw err;
                let done = 0;
                files.forEach(f => {
                    sftp.fastPut(path.join(__dirname, f.local), `${APP}/${f.remote}`, {
                        step: (transferred, chunk, total) => {
                            if (f.local.endsWith('.exe')) {
                                process.stdout.write(`\r📤 Uploading EXE: ${(transferred / 1024 / 1024).toFixed(2)} MB`);
                            }
                        }
                    }, (err) => {
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
        });
    });
}).connect({
    host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000
});
