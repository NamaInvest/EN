const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.sftp((e, sftp) => {
        if (e) throw e;
        const upload = (local, remote, label) => new Promise((res, rej) =>
            sftp.fastPut(local, remote, {}, err => {
                if (err) { console.error(`❌ ${label}:`, err.message); rej(err); }
                else { console.log(`✅ ${label}`); res(); }
            })
        );
        const run = async () => {
            // Upload to both locations (main and saas)
            await upload('c:/Users/1/Desktop/alfa/src/app/ice/page.tsx', '/www/wwwroot/namainvist.com/src/app/ice/page.tsx', 'ice/page (main)');
            await upload('c:/Users/1/Desktop/alfa/src/app/ice/page.tsx', '/www/wwwroot/n11.namainvist.com/src/app/ice/page.tsx', 'ice/page (saas)');

            console.log('\n🔨 Rebuilding apps to apply the new UI...');
            conn.exec(`
rm -f /tmp/ice_re_main.flag /tmp/ice_re_saas.flag /tmp/ice_re_err.flag
nohup bash -c 'cd /www/wwwroot/namainvist.com && npm run build > /tmp/ice_re_main.log 2>&1 && pm2 restart main-site && touch /tmp/ice_re_main.flag || touch /tmp/ice_re_err.flag' &
nohup bash -c 'cd /www/wwwroot/n11.namainvist.com && npm run build > /tmp/ice_re_saas.log 2>&1 && pm2 restart saas-app && touch /tmp/ice_re_saas.flag || touch /tmp/ice_re_err.flag' &
echo "Started build processes"
            `, (e3, s3) => {
                s3.on('data', d => process.stdout.write(d.toString()));
                s3.on('close', () => { console.log('⏳ Polling status...'); conn.end(); });
            });
        };
        run().catch(e => { console.error(e); conn.end(); });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });

let tries = 0;
const poll = () => {
    tries++;
    const c = new Client();
    c.on('ready', () => {
        c.exec(`
m=$([ -f /tmp/ice_re_main.flag ] && echo "DONE" || echo "Building...")
s=$([ -f /tmp/ice_re_saas.flag ] && echo "DONE" || echo "Building...")
echo "MAIN: $m | SAAS: $s (${tries*15}s)"
if [ "$m" = "DONE" ] && [ "$s" = "DONE" ]; then
    pm2 list | grep -E "main|saas"
fi
        `, (e, s) => {
            let out = '';
            s.on('data', d => { out += d; process.stdout.write(d.toString()); });
            s.on('close', () => {
                c.end();
                if ((out.includes('MAIN: DONE') && out.includes('SAAS: DONE')) || tries >= 50) {
                    console.log('\n✅ Deployment finished!');
                    return;
                }
                setTimeout(poll, 15000);
            });
        });
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
};
setTimeout(poll, 20000);
