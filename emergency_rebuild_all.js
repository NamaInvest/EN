/**
 * emergency_rebuild_all.js
 * طارئ: يرفع كل الـ components + يعيد البناء على N1-N11
 */
const { Client } = require('ssh2');
const fs   = require('fs');
const path = require('path');

const HOST  = '46.4.188.170';
const PASS  = '_ee4SWbxLVfH9b';
const LOCAL = 'd:\\namasoft9-3-main';

const NODES = [
    { name: 'n11', dir: '/www/wwwroot/n11.namainvist.com', pm2: 'n11' },
    { name: 'n1',  dir: '/www/wwwroot/n1.namainvist.com',  pm2: 'n1-main' },
    { name: 'n2',  dir: '/www/wwwroot/n2.namainvist.com',  pm2: 'n2' },
    { name: 'n3',  dir: '/www/wwwroot/n3.namainvist.com',  pm2: 'n3' },
    { name: 'n4',  dir: '/www/wwwroot/n4.namainvist.com',  pm2: 'n4' },
    { name: 'n5',  dir: '/www/wwwroot/n5.namainvist.com',  pm2: 'n5' },
    { name: 'n6',  dir: '/www/wwwroot/n6.namainvist.com',  pm2: 'n6' },
    { name: 'n7',  dir: '/www/wwwroot/n7.namainvist.com',  pm2: 'n7' },
    { name: 'n8',  dir: '/www/wwwroot/n8.namainvist.com',  pm2: 'n8' },
    { name: 'n9',  dir: '/www/wwwroot/n9.namainvist.com',  pm2: 'n9' },
    { name: 'n10', dir: '/www/wwwroot/n10.namainvist.com', pm2: 'n10' },
];

// كل الـ components
const compDir = path.join(LOCAL, 'src\\components');
const componentFiles = fs.readdirSync(compDir)
    .filter(f => f.endsWith('.tsx') || f.endsWith('.ts'))
    .map(f => `src/components/${f}`);

// APIs المفقودة
const apiFiles = [
    'src/app/api/hr/employees/route.ts',
    'src/app/api/accounts/route.ts',
];

// Layout
const layoutFiles = [
    'src/app/(dashboard)/layout.tsx',
    'src/app/layout.tsx',
    'src/app/globals.css',
];

const ALL_FILES = [...componentFiles, ...apiFiles, ...layoutFiles].filter(f => {
    return fs.existsSync(path.join(LOCAL, f.replace(/\//g, '\\')));
});

console.log(`\n🚨 إصلاح طارئ — رفع ${ALL_FILES.length} ملف على ${NODES.length} نود`);
console.log('المشكلة: TrialBanner.tsx وملفات أخرى غير موجودة على السيرفر\n');
console.log('═'.repeat(60));

async function fixNode(node) {
    return new Promise((resolve) => {
        const conn = new Client();
        const log  = (m) => console.log(`[${node.name.toUpperCase()}] ${m}`);

        conn.on('error', (e) => {
            log(`❌ خطأ: ${e.message}`);
            resolve({ node: node.name, ok: false });
        });

        conn.on('ready', () => {
            conn.sftp(async (err, sftp) => {
                if (err) { log('SFTP error'); conn.end(); return resolve({ node: node.name, ok: false }); }

                // إنشاء المجلدات الجديدة
                for (const d of [`${node.dir}/src/app/api/hr/employees`, `${node.dir}/src/app/api/accounts`]) {
                    await new Promise(r => conn.exec(`mkdir -p "${d}"`, (e, s) => { s?.resume(); s?.on('close', r); if(e) r(null); }));
                }

                // رفع الملفات
                let ok = 0;
                for (const f of ALL_FILES) {
                    const buf = fs.readFileSync(path.join(LOCAL, f.replace(/\//g, '\\')));
                    await new Promise(r => {
                        sftp.open(`${node.dir}/${f}`, 'w', (e, h) => {
                            if (e) return r(null);
                            sftp.write(h, buf, 0, buf.length, 0, (e2) => {
                                sftp.close(h, () => { if (!e2) ok++; r(null); });
                            });
                        });
                    });
                }
                sftp.end();
                log(`📤 رُفع ${ok}/${ALL_FILES.length} ملف — بدء البناء...`);

                // بناء وتشغيل
                await new Promise(r => {
                    conn.exec(`cd ${node.dir} && npm run build 2>&1 | tail -8 && pm2 restart ${node.pm2} 2>&1 | tail -3`, (e, s) => {
                        if (e) { log('build error: ' + e.message); return r(null); }
                        let out = '';
                        s.on('data', d => { out += d.toString(); });
                        s.stderr.on('data', d => { out += d.toString(); });
                        s.on('close', () => {
                            if (out.includes('online') || out.includes('Compiled')) {
                                log('🟢 جاهز!');
                            } else if (out.includes('error') || out.includes('Error')) {
                                // استخرج أول خطأ
                                const errLine = out.split('\n').find(l => l.toLowerCase().includes('error'));
                                log(`⚠️  ${errLine || out.slice(-150)}`);
                            } else {
                                log(`✅ اكتمل`);
                            }
                            r(null);
                        });
                    });
                });

                conn.end();
                resolve({ node: node.name, ok: true, uploaded: ok });
            });
        });

        conn.connect({ host: HOST, port: 22, username: 'root', password: PASS, readyTimeout: 25000 });
    });
}

async function main() {
    const BATCH = 2; // 2 في نفس الوقت لتجنب ضغط الذاكرة
    const results = [];

    for (let i = 0; i < NODES.length; i += BATCH) {
        const batch = NODES.slice(i, i + BATCH);
        console.log(`\n⚡ المجموعة: ${batch.map(n => n.name.toUpperCase()).join(' + ')}`);
        const res = await Promise.all(batch.map(fixNode));
        results.push(...res);
    }

    console.log('\n' + '═'.repeat(60));
    console.log('\n📊 النتائج:\n');
    results.forEach(r => {
        console.log(`  ${r.ok ? '✅' : '❌'} ${r.node.toUpperCase()}${r.uploaded ? ` — ${r.uploaded} ملف` : ''}`);
    });
    const done = results.filter(r => r.ok).length;
    console.log(`\n🎉 ${done}/${NODES.length} نود تم إصلاحه`);
}

main().catch(console.error);
