const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.sftp((e, sftp) => {
        if (e) throw e;
        sftp.fastPut(
            'c:/Users/1/Desktop/alfa/src/middleware.ts',
            '/www/wwwroot/namainvist.com/src/middleware.ts',
            {}, err => {
                if (err) { console.error('❌', err.message); conn.end(); return; }
                console.log('✅ middleware.ts uploaded');
                conn.exec(
                    'rm -f /tmp/p_done.flag /tmp/p_err.flag && nohup bash -c \'cd /www/wwwroot/namainvist.com && npm run build > /tmp/p_build.log 2>&1 && pm2 restart main-site && touch /tmp/p_done.flag || touch /tmp/p_err.flag\' & echo started',
                    (e2, s2) => {
                        s2.on('data', d => process.stdout.write(d.toString()));
                        s2.on('close', () => { console.log('⏳ Polling...'); conn.end(); });
                    }
                );
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
if [ -f /tmp/p_done.flag ]; then echo "DONE"; pm2 list | grep main
elif [ -f /tmp/p_err.flag ]; then echo "FAILED"; tail -10 /tmp/p_build.log
else echo "Building... (${tries*15}s)"; tail -2 /tmp/p_build.log 2>/dev/null; fi
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
