const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        sftp.fastPut(
            'd:/namasoft9-3-main/src/app/api/tenant/check-status/route.ts',
            '/www/wwwroot/n11.namainvist.com/src/app/api/tenant/check-status/route.ts',
            {},
            err => {
                if (err) { console.error('❌ Upload failed:', err.message); conn.end(); return; }
                console.log('✅ check-status/route.ts uploaded!');
                // تحقق سريع
                conn.exec('head -8 /www/wwwroot/n11.namainvist.com/src/app/api/tenant/check-status/route.ts', (e, s) => {
                    s.on('data', d => process.stdout.write(d.toString()));
                    s.on('close', () => {
                        // بناء في الخلفية
                        console.log('\n🔨 Building saas-app in background...');
                        conn.exec(`
pm2 stop saas-app
rm -f /tmp/build_done2.flag /tmp/build_err2.flag
nohup bash -c 'cd /www/wwwroot/n11.namainvist.com && npm run build > /tmp/saas_build2.log 2>&1 && pm2 start saas-app && touch /tmp/build_done2.flag || touch /tmp/build_err2.flag' &
echo "PID: $!"
                        `, (e2, s2) => {
                            s2.on('data', d => process.stdout.write(d.toString()));
                            s2.on('close', () => { console.log('⏳ Polling...'); conn.end(); });
                        });
                    });
                });
            }
        );
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });

// Poll كل 15 ثانية
let tries = 0;
const poll = () => {
    tries++;
    const c = new Client();
    c.on('ready', () => {
        c.exec(`
if [ -f /tmp/build_done2.flag ]; then 
    echo "✅ BUILD DONE"
    curl -s "http://127.0.0.1:3500/api/tenant/check-status?userId=user_3CVlTU5PDDyb3Ofw8aJFXYOuNFs"
    pm2 list | grep saas
elif [ -f /tmp/build_err2.flag ]; then 
    echo "❌ BUILD FAILED"
    tail -20 /tmp/saas_build2.log
else
    echo "⏳ Building... (${tries*15}s)"
    tail -2 /tmp/saas_build2.log 2>/dev/null
fi
        `, (e, s) => {
            let out = '';
            s.on('data', d => { out += d; process.stdout.write(d.toString()); });
            s.on('close', () => {
                c.end();
                if (out.includes('DONE') || out.includes('FAILED')) { console.log('\n✅ Done!'); return; }
                if (tries < 40) setTimeout(poll, 15000);
            });
        });
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
};
setTimeout(poll, 20000);
