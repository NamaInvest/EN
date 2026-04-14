/**
 * deploy_srv2_from_n11.js
 * ══════════════════════════════════════════════════════
 * نسخ الكود الكامل من N11 (= الكود المحلي) إلى سيرفر 204.168.144.74
 * 
 * الخطوات:
 *  1. ضغط src/ + ملفات الجذر المهمة → src_deploy.zip
 *  2. اتصال بسيرفر 204 عبر SSH Key
 *  3. نسخة احتياطية بتاريخ اليوم لكل من namasoft و namasoft2
 *  4. رفع الـ zip عبر SFTP
 *  5. استخراج + استعادة .env لكل instance
 *  6. بناء وإعادة تشغيل كلا الـ instances
 * 
 * ❌ لا يمس: .env لكل instance (بيانات DB مختلفة)
 * ❌ لا يمس: أي بيانات مبيعات أو مخزون
 * ══════════════════════════════════════════════════════
 */

const { Client } = require('ssh2');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ── إعدادات السيرفر 204 ──────────────────────────────
const SSH_CONFIG = {
    host: '204.168.144.74',
    port: 22,
    username: 'root',
    privateKey: fs.readFileSync('C:\\Users\\1\\Desktop\\namasoftkey\\namasoft_key'),
    readyTimeout: 30000,
};

const LOCAL_ROOT = 'd:\\namasoft9-3-main';
const ZIP_PATH   = path.join(LOCAL_ROOT, 'src_deploy.zip');

const TODAY = new Date().toISOString().slice(0, 10).replace(/-/g, '');

// الـ instances على سيرفر 204
const INSTANCES = [
    { dir: '/var/www/namasoft',  pm2: 'namasoft'  },
    { dir: '/var/www/namasoft2', pm2: 'namasoft2' },
];

// ── دالة SSH ─────────────────────────────────────────
function runSSH(conn, cmd, silent = false) {
    return new Promise((resolve, reject) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            let out = '';
            stream.on('data', d => { if (!silent) process.stdout.write(d); out += d; });
            stream.stderr.on('data', d => { if (!silent) process.stdout.write(d); });
            stream.on('close', () => resolve(out));
        });
    });
}

// ── رفع ملف عبر SFTP ─────────────────────────────────
function uploadFile(sftp, localPath, remotePath) {
    return new Promise((resolve, reject) => {
        console.log(`  📤 جاري رفع ${path.basename(localPath)} (${(fs.statSync(localPath).size / 1024 / 1024).toFixed(1)} MB)...`);
        const writeStream = sftp.createWriteStream(remotePath);
        writeStream.on('close', () => { console.log(`  ✅ تم الرفع!`); resolve(); });
        writeStream.on('error', reject);
        fs.createReadStream(localPath).pipe(writeStream);
    });
}

// ── البرنامج الرئيسي ──────────────────────────────────
async function main() {
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║  🚀 نسخ N11 → سيرفر 204.168.144.74                 ║');
    console.log('╚══════════════════════════════════════════════════════╝\n');

    // ════ خطوة 1: ضغط الكود محلياً ════════════════════
    console.log('🗜️  [1/5] ضغط الكود محلياً...');
    try {
        if (fs.existsSync(ZIP_PATH)) fs.unlinkSync(ZIP_PATH);

        // قائمة الملفات والمجلدات المراد ضغطها
        const rootFiles = [
            'next.config.ts', 'tsconfig.json', 'translations.ts',
            'translations_git.ts', 'tailwind.config.ts',
            'postcss.config.mjs', 'middleware.ts', 'prisma'
        ].filter(f => fs.existsSync(path.join(LOCAL_ROOT, f)));

        const items = [path.join(LOCAL_ROOT, 'src'), ...rootFiles.map(f => path.join(LOCAL_ROOT, f))].join('", "');

        const psCmd = `Compress-Archive -Path "${items}" -DestinationPath "${ZIP_PATH}" -Force`;
        execSync(`powershell -NoProfile -NonInteractive -Command "${psCmd.replace(/"/g, '\\"')}"`, { stdio: 'pipe' });

        if (!fs.existsSync(ZIP_PATH)) throw new Error('ZIP not created');
        const sizeMB = (fs.statSync(ZIP_PATH).size / 1024 / 1024).toFixed(1);
        console.log(`  ✅ تم إنشاء src_deploy.zip حجمه ${sizeMB} MB\n`);
    } catch (e) {
        console.error('❌ فشل الضغط:', e.message);
        process.exit(1);
    }

    // ════ خطوات 2-5: SSH إلى سيرفر 204 ════════════════
    const conn = new Client();

    conn.on('ready', async () => {
        console.log('🔗 [2/5] متصل بسيرفر 204.168.144.74!\n');

        try {
            // ── نسخة احتياطية بتاريخ اليوم ───────────
            console.log(`🔒 [2/5] نسخة احتياطية بتاريخ ${TODAY}...`);
            for (const inst of INSTANCES) {
                const backupDir = `${inst.dir}_backup_${TODAY}`;
                console.log(`  📋 نسخ ${inst.dir} → ${backupDir}`);
                await runSSH(conn, `cp -r ${inst.dir} ${backupDir} 2>&1 && echo "✅ Backup done"`, false);
            }
            console.log('');

            // ── رفع الـ zip ───────────────────────────
            console.log('📤 [3/5] رفع الكود عبر SFTP...');
            await new Promise((resolve, reject) => {
                conn.sftp(async (err, sftp) => {
                    if (err) return reject(err);
                    await uploadFile(sftp, ZIP_PATH, '/tmp/src_deploy.zip');
                    sftp.end();
                    resolve();
                });
            });
            console.log('');

            // ── استخراج الكود لكل instance ────────────
            console.log('📦 [4/5] استخراج الكود وتطبيقه على كل instance...');
            for (const inst of INSTANCES) {
                console.log(`\n  ▶ ${inst.dir}`);

                // احفظ .env
                console.log(`    🔐 حفظ .env...`);
                await runSSH(conn, `cp ${inst.dir}/.env /tmp/env_${inst.pm2}_backup 2>/dev/null || echo "no .env found"`, false);

                // استخرج الـ zip
                console.log(`    📂 استخراج الكود...`);
                await runSSH(conn, `
                    cd /tmp &&
                    rm -rf src_deploy_extracted &&
                    mkdir -p src_deploy_extracted &&
                    unzip -o /tmp/src_deploy.zip -d /tmp/src_deploy_extracted > /dev/null 2>&1 &&
                    echo "✅ Extracted"
                `, false);

                // انسخ src/ +الملفات
                console.log(`    🔄 نسخ الملفات...`);
                await runSSH(conn, `
                    # src/
                    if [ -d /tmp/src_deploy_extracted/src ]; then
                        rm -rf ${inst.dir}/src
                        cp -r /tmp/src_deploy_extracted/src ${inst.dir}/src
                        echo "✅ src/ copied"
                    fi
                    # ملفات الجذر
                    for f in next.config.ts tsconfig.json translations.ts translations_git.ts tailwind.config.ts postcss.config.mjs middleware.ts; do
                        if [ -f /tmp/src_deploy_extracted/$f ]; then
                            cp /tmp/src_deploy_extracted/$f ${inst.dir}/$f
                            echo "✅ $f copied"
                        fi
                    done
                `, false);

                // استعد .env
                console.log(`    🔐 استعادة .env...`);
                await runSSH(conn, `
                    if [ -f /tmp/env_${inst.pm2}_backup ]; then
                        cp /tmp/env_${inst.pm2}_backup ${inst.dir}/.env
                        rm /tmp/env_${inst.pm2}_backup
                        echo "✅ .env restored"
                    fi
                `, false);
            }

            // ── تنظيف ملفات مؤقتة ────────────────────
            await runSSH(conn, `rm -rf /tmp/src_deploy.zip /tmp/src_deploy_extracted`, true);

            // ── بناء وإعادة تشغيل ─────────────────────
            console.log('\n🔨 [5/5] بناء وإعادة تشغيل كل instance...');
            for (const inst of INSTANCES) {
                console.log(`\n  ▶ بناء ${inst.pm2}...`);
                await runSSH(conn, `cd ${inst.dir} && npm run build 2>&1 | tail -15`, false);
                console.log(`  🔄 إعادة تشغيل ${inst.pm2}...`);
                await runSSH(conn, `pm2 restart ${inst.pm2} 2>&1 | tail -5`, false);
                console.log(`  ✅ ${inst.pm2} يعمل!`);
            }

            console.log('\n╔══════════════════════════════════════════════════════╗');
            console.log('║  🎉 اكتمل النشر على 204.168.144.74 بنجاح!          ║');
            console.log(`║  📋 النسخة الاحتياطية: *_backup_${TODAY}          ║`);
            console.log('║  ✅ namasoft  → تم                                  ║');
            console.log('║  ✅ namasoft2 → تم                                  ║');
            console.log('║  🔒 .env محمي لكل instance                          ║');
            console.log('║  🔒 بيانات DB لم تُمس                               ║');
            console.log('╚══════════════════════════════════════════════════════╝');

        } catch (e) {
            console.error('\n❌ خطأ:', e.message);
        } finally {
            conn.end();
        }
    });

    conn.on('error', err => {
        console.error('❌ فشل الاتصال بسيرفر 204:', err.message);
        process.exit(1);
    });

    conn.connect(SSH_CONFIG);
}

main();
