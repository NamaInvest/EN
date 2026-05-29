const { Client } = require('ssh2');

const NODES = [
    { name: 'n11', dir: '/www/wwwroot/n11.namainvist.com', pm2: 'n11' },
    { name: 'n1',  dir: '/www/wwwroot/n1.namainvist.com',  pm2: 'n1-main' },
];

async function fixNode(node) {
    return new Promise((resolve) => {
        const conn = new Client();
        const log = (m) => console.log(`[${node.name.toUpperCase()}] ${m}`);

        conn.on('ready', () => {
            // أولاً: شوف سبب فشل البناء
            const diagCmd = `cd ${node.dir} && npm run build 2>&1 | tail -30`;
            log('🔍 فحص سبب الخطأ...');
            conn.exec(diagCmd, (e, s) => {
                if (e) { log('SSH error: ' + e.message); conn.end(); return resolve(false); }
                let out = '';
                s.on('data', d => { out += d; process.stdout.write(`[${node.name.toUpperCase()}] ${d}`); });
                s.stderr.on('data', d => { out += d; process.stdout.write(`[${node.name.toUpperCase()}] STDERR: ${d}`); });
                s.on('close', () => {
                    const success = out.includes('✓ Compiled') || out.includes('Route (app)') || out.includes('Generating static pages');
                    if (success) {
                        log('✅ البناء نجح! أعيد التشغيل...');
                        conn.exec(`pm2 restart ${node.pm2}`, (e2, s2) => {
                            s2?.resume(); s2?.on('close', () => { conn.end(); resolve(true); });
                        });
                    } else {
                        log('❌ البناء فشل — أنظر الأخطاء أعلاه');
                        conn.end();
                        resolve(false);
                    }
                });
            });
        });

        conn.on('error', (e) => { console.log(`[${node.name.toUpperCase()}] ❌ ${e.message}`); resolve(false); });
        conn.connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 20000 });
    });
}

(async () => {
    console.log('🔍 تشخيص N11 أولاً...\n');
    await fixNode(NODES[0]);
})();
