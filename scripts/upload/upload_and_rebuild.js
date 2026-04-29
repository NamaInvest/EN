const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) { console.error(err); conn.end(); return; }
        sftp.fastPut(
            'c:/Users/1/Desktop/alfa/src/lib/quotaGuard.ts',
            '/www/wwwroot/n11.namainvist.com/src/lib/quotaGuard.ts',
            {},
            (err) => {
                if (err) { console.error('❌ Upload failed:', err.message); conn.end(); return; }
                console.log('✅ quotaGuard.ts uploaded!');

                // تحقق
                conn.exec('cat /www/wwwroot/n11.namainvist.com/src/lib/quotaGuard.ts | head -5', (e, s) => {
                    s.on('data', d => process.stdout.write(d.toString()));
                    s.on('close', () => {
                        // الآن أعِد البناء
                        console.log('\n🔨 Rebuilding saas-app...');
                        conn.exec(`
rm -f /tmp/build_done.flag /tmp/build_error.flag
nohup bash -c 'cd /www/wwwroot/n11.namainvist.com && npm run build > /tmp/saas_build.log 2>&1 && pm2 start saas-app && touch /tmp/build_done.flag || touch /tmp/build_error.flag' &
echo "PID: $!"
                        `, (e2, s2) => {
                            s2.on('data', d => process.stdout.write(d.toString()));
                            s2.on('close', () => { console.log('\n⏳ Build started. Polling...'); conn.end(); });
                        });
                    });
                });
            }
        );
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });

// Poll
let tries = 0;
const poll = () => {
    tries++;
    const c = new Client();
    c.on('ready', () => {
        c.exec(`
if [ -f /tmp/build_done.flag ]; then echo "✅ DONE"; pm2 list | grep saas;
elif [ -f /tmp/build_error.flag ]; then echo "❌ FAILED"; tail -15 /tmp/saas_build.log;
else echo "⏳ Building... (${tries*15}s)"; tail -2 /tmp/saas_build.log 2>/dev/null; fi
        `, (e, s) => {
            let out = '';
            s.on('data', d => { out += d; process.stdout.write(d.toString()); });
            s.on('close', () => {
                c.end();
                if (out.includes('DONE') || out.includes('FAILED')) return;
                if (tries < 40) setTimeout(poll, 15000);
            });
        });
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
};
setTimeout(poll, 20000);
