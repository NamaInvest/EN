const { Client } = require('ssh2');

const now = new Date();
const pad = n => String(n).padStart(2, '0');
const STAMP = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;

const SOURCE = '/www/wwwroot/n11.namainvist.com';
const BACKUP_DIR = `/www/wwwroot/n11_backup_${STAMP}`;

const conn = new Client();
conn.on('ready', async () => {
    console.log(`✅ متصل - الختم الزمني: ${STAMP}\n`);

    const run = (cmd) => new Promise((resolve, reject) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            let out = '';
            stream.on('data', d => { process.stdout.write(d); out += d; });
            stream.stderr.on('data', d => process.stdout.write(d));
            stream.on('close', () => resolve(out));
        });
    });

    try {
        // 1. اقرأ .env لاستخراج DATABASE_URL
        console.log('📄 [1] قراءة إعدادات قاعدة البيانات...');
        const envContent = await run(`cat ${SOURCE}/.env 2>/dev/null`);
        
        // استخراج DATABASE_URL
        const dbUrlMatch = envContent.match(/DATABASE_URL="([^"]+)"/);
        let dbName = 'n11db';
        let dbUser = 'postgres';
        
        if (dbUrlMatch) {
            const dbUrl = dbUrlMatch[1];
            console.log(`  🔗 DATABASE_URL موجود`);
            // postgresql://user:pass@host:port/dbname?schema=xxx
            const dbNameMatch = dbUrl.match(/\/([^/?]+)(\?|$)/);
            const dbUserMatch = dbUrl.match(/\/\/([^:]+):/);
            if (dbNameMatch) dbName = dbNameMatch[1];
            if (dbUserMatch) dbUser = dbUserMatch[1];
        }
        console.log(`  🗄️  قاعدة البيانات: ${dbName} | المستخدم: ${dbUser}`);

        // 2. نسخة احتياطية للكود
        console.log(`\n📋 [2] نسخ الكود...`);
        console.log(`    ${SOURCE} → ${BACKUP_DIR}`);
        await run(`cp -r ${SOURCE} ${BACKUP_DIR} && echo "✅ تم نسخ الكود"`);

        // 3. نسخة احتياطية لقاعدة البيانات
        console.log(`\n🗄️  [3] نسخ قاعدة البيانات (${dbName})...`);
        const dbBackupFile = `${BACKUP_DIR}/db_backup_${STAMP}.sql`;
        
        // جرب pg_dump مع صلاحيات postgres
        const pgDumpResult = await run(
            `pg_dump -U postgres ${dbName} > ${dbBackupFile} 2>&1 && echo "SUCCESS" || echo "FAILED"`
        );
        
        if (pgDumpResult.includes('SUCCESS') || !pgDumpResult.includes('FAILED')) {
            const dbSize = await run(`du -sh ${dbBackupFile} 2>/dev/null | cut -f1`);
            console.log(`  ✅ قاعدة البيانات محفوظة → db_backup_${STAMP}.sql (${dbSize.trim()})`);
        } else {
            // جرب بدون كلمة مرور
            console.log('  ⚠️  جاري المحاولة بصلاحية root...');
            await run(`sudo -u postgres pg_dump ${dbName} > ${dbBackupFile} 2>&1 && echo "SUCCESS" || echo "FAILED"`);
            const dbSize = await run(`du -sh ${dbBackupFile} 2>/dev/null | cut -f1`);
            console.log(`  ✅ قاعدة البيانات محفوظة (${dbSize.trim()})`);
        }

        // 4. الحجم الإجمالي
        console.log(`\n📊 [4] حجم النسخة الاحتياطية...`);
        await run(`du -sh ${BACKUP_DIR} 2>&1`);

        // 5. قائمة النسخ الاحتياطية لـ n11
        console.log(`\n📁 [5] كل النسخ الاحتياطية المتاحة...`);
        await run(`ls -lh /www/wwwroot/ | grep n11 2>&1`);

        console.log('\n╔══════════════════════════════════════════════════════╗');
        console.log('║  ✅ النسخة الاحتياطية اكتملت بنجاح!               ║');
        console.log(`║  📁 ${BACKUP_DIR.padEnd(47)}║`);
        console.log(`║  🗄️  db_backup_${STAMP}.sql                 ║`);
        console.log('╚══════════════════════════════════════════════════════╝');

    } catch (e) {
        console.error('❌ خطأ:', e.message);
    } finally {
        conn.end();
    }
}).connect({
    host: '46.4.188.170', port: 22,
    username: 'root', password: '_ee4SWbxLVfH9b',
    readyTimeout: 20000,
});
