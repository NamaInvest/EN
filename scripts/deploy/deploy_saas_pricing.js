const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    // Create pricing dir in saas then upload
    conn.exec('mkdir -p /www/wwwroot/n11.namainvist.com/src/app/pricing', (e, s) => {
        s.resume();
        s.on('close', () => {
            conn.sftp((e2, sftp) => {
                sftp.fastPut(
                    'c:/Users/1/Desktop/alfa/src/app/pricing/page.tsx',
                    '/www/wwwroot/n11.namainvist.com/src/app/pricing/page.tsx',
                    {}, err => {
                        if (err) { console.error('❌ pricing (saas):', err.message); conn.end(); return; }
                        console.log('✅ pricing (saas)');
                        console.log('🔨 Building saas-app...');
                        conn.exec(
                            'rm -f /tmp/g_saas.flag /tmp/g_err.flag && nohup bash -c \'cd /www/wwwroot/n11.namainvist.com && npm run build > /tmp/g_saas.log 2>&1 && pm2 restart saas-app && touch /tmp/g_saas.flag || touch /tmp/g_err.flag\' & echo started',
                            (e3, s3) => {
                                s3.on('data', d => process.stdout.write(d.toString()));
                                s3.on('close', () => { console.log('⏳ Polling...'); conn.end(); });
                            }
                        );
                    }
                );
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
if [ -f /tmp/g_saas.flag ]; then echo "DONE"; pm2 list | grep saas
elif [ -f /tmp/g_err.flag ]; then echo "FAILED"; tail -10 /tmp/g_saas.log
else echo "Building... (${tries*15}s)"; tail -2 /tmp/g_saas.log 2>/dev/null; fi
        `, (e, s) => {
            let out = '';
            s.on('data', d => { out += d; process.stdout.write(d.toString()); });
            s.on('close', () => {
                c.end();
                if (out.includes('DONE') || out.includes('FAILED') || tries >= 40) return;
                setTimeout(poll, 15000);
            });
        });
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
};
setTimeout(poll, 20000);
