const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        sftp.fastPut(
            'd:/namasoft9-3-main/src/middleware.ts',
            '/www/wwwroot/namainvist.com/src/middleware.ts',
            {},
            err => {
                if (err) { console.error('❌ Upload failed:', err.message); conn.end(); return; }
                console.log('✅ middleware.ts uploaded');
                // تحقق من email
                conn.exec('grep -n "OWNER_EMAIL\|ialqrashi" /www/wwwroot/namainvist.com/src/middleware.ts | head -5', (e, s) => {
                    s.on('data', d => process.stdout.write(d.toString()));
                    s.on('close', () => {
                        console.log('\n🔨 Building main-site...');
                        conn.exec(
                            'rm -f /tmp/mid_done.flag /tmp/mid_err.flag && nohup bash -c \'cd /www/wwwroot/namainvist.com && npm run build > /tmp/mid_build.log 2>&1 && pm2 restart main-site && touch /tmp/mid_done.flag || touch /tmp/mid_err.flag\' & echo "PID: $!"',
                            (e2, s2) => {
                                s2.on('data', d => process.stdout.write(d.toString()));
                                s2.on('close', () => { console.log('⏳ Polling...'); conn.end(); });
                            }
                        );
                    });
                });
            }
        );
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });

let tries = 0;
const poll = () => {
    tries++;
    const c = new Client();
    c.on('ready', () => {
        c.exec(`
if [ -f /tmp/mid_done.flag ]; then echo "✅ DONE"; pm2 list | grep main;
elif [ -f /tmp/mid_err.flag ]; then echo "❌ FAILED"; tail -15 /tmp/mid_build.log;
else echo "⏳ Building... (${tries*15}s)"; tail -2 /tmp/mid_build.log 2>/dev/null; fi
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
