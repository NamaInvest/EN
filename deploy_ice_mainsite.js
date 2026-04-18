const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
mkdir -p /www/wwwroot/namainvist.com/src/app/ice
mkdir -p /www/wwwroot/namainvist.com/src/app/api/ice/tenants
mkdir -p /www/wwwroot/namainvist.com/src/app/api/ice/toggle
echo "✅ Dirs created"
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            conn.sftp((e, sftp) => {
                if (e) throw e;
                const upload = (local, remote, label) => new Promise((res, rej) =>
                    sftp.fastPut(local, remote, {}, err => {
                        if (err) { console.error(`❌ ${label}:`, err.message); rej(err); }
                        else { console.log(`✅ ${label}`); res(); }
                    })
                );
                const run = async () => {
                    await upload('d:/namasoft9-3-main/src/app/ice/page.tsx', '/www/wwwroot/namainvist.com/src/app/ice/page.tsx', 'ice/page.tsx (main-site)');
                    await upload('d:/namasoft9-3-main/src/app/api/ice/tenants/route.ts', '/www/wwwroot/namainvist.com/src/app/api/ice/tenants/route.ts', 'ice/tenants (main-site)');
                    await upload('d:/namasoft9-3-main/src/app/api/ice/toggle/route.ts', '/www/wwwroot/namainvist.com/src/app/api/ice/toggle/route.ts', 'ice/toggle (main-site)');

                    console.log('\n🔨 Building main-site...');
                    conn.exec(`
rm -f /tmp/ice_done.flag /tmp/ice_err.flag
nohup bash -c 'cd /www/wwwroot/namainvist.com && npm run build > /tmp/ice_build.log 2>&1 && pm2 restart main-site && touch /tmp/ice_done.flag || touch /tmp/ice_err.flag' &
echo "PID: $!"
                    `, (e2, s2) => {
                        s2.on('data', d => process.stdout.write(d.toString()));
                        s2.on('close', () => { console.log('⏳ Polling...'); conn.end(); });
                    });
                };
                run().catch(e => { console.error(e); conn.end(); });
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });

let tries = 0;
const poll = () => {
    tries++;
    const c = new Client();
    c.on('ready', () => {
        c.exec(`
if [ -f /tmp/ice_done.flag ]; then echo "✅ BUILD DONE"; pm2 list | grep main;
elif [ -f /tmp/ice_err.flag ]; then echo "❌ BUILD FAILED"; tail -15 /tmp/ice_build.log;
else echo "⏳ Building... (${tries*15}s)"; tail -2 /tmp/ice_build.log 2>/dev/null; fi
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
