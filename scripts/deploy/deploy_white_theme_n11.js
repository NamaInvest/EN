const { Client } = require('ssh2');
const fs = require('fs');

const FILES = [
    { local: 'c:\\Users\\1\\Desktop\\alfa\\src\\app\\globals.css',            remote: 'src/app/globals.css' },
    { local: 'c:\\Users\\1\\Desktop\\alfa\\src\\app\\layout.tsx',             remote: 'src/app/layout.tsx' },
    { local: 'c:\\Users\\1\\Desktop\\alfa\\src\\components\\ThemeSwitcher.tsx', remote: 'src/components/ThemeSwitcher.tsx' },
];

const NODE = { dir: '/www/wwwroot/n11.namainvist.com', pm2: 'n11' };

const conn = new Client();
conn.on('ready', () => {
    console.log('✅ متصل - نشر الثيم الأبيض + ThemeSwitcher على N11\n');
    conn.sftp(async (err, sftp) => {
        if (err) throw err;

        for (const f of FILES) {
            const buf = fs.readFileSync(f.local);
            const remotePath = `${NODE.dir}/${f.remote}`;
            console.log(`📤 رفع ${f.remote}...`);
            await new Promise((res, rej) => {
                sftp.open(remotePath, 'w', (e, h) => {
                    if (e) return rej(e);
                    sftp.write(h, buf, 0, buf.length, 0, (e2) => {
                        if (e2) return rej(e2);
                        sftp.close(h, () => { console.log(`  ✅ تم`); res(); });
                    });
                });
            });
        }
        sftp.end();

        console.log('\n🔨 npm run build...');
        await new Promise((res, rej) => {
            conn.exec(`cd ${NODE.dir} && npm run build 2>&1 | tail -10 && pm2 restart ${NODE.pm2}`, (e, s) => {
                if (e) return rej(e);
                s.on('data', d => process.stdout.write(d));
                s.stderr.on('data', d => process.stdout.write(d));
                s.on('close', res);
            });
        });

        console.log('\n✅ تم! الآن "أبيض نقي" يظهر في قائمة الثيمات على N11');
        conn.end();
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 20000 });
