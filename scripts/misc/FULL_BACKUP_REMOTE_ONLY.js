const { Client } = require('ssh2');

const TODAY = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const BACKUP_TAR = `/www/wwwroot/namainvist_full_backup_${TODAY}.tar.gz`;

const conn = new Client();
conn.on('ready', async () => {
    console.log('✅ متصل بسيرفر 46.4.188.170\n');

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
        console.log('📊 [1/3] جاري استخراج قواعد البيانات (PostgreSQL)...');
        await run(`cd /www/wwwroot && pg_dumpall -U postgres -h localhost > all_databases.sql`);
        
        console.log(`\n📋 [2/3] جاري ضغط جميع النطاقات الفرعية وقاعدة البيانات إلى ${BACKUP_TAR}...`);
        await run(`cd /www/wwwroot && tar -czf ${BACKUP_TAR} --exclude="*/node_modules" --exclude="*/.next" all_databases.sql *.namainvist.com namainvist.com`);

        console.log('\n📊 [3/3] جاري التحقق من حجم النسخة الاحتياطية النهائية...');
        await run(`du -sh ${BACKUP_TAR} 2>&1`);
        
        // مسح ملف قاعدة البيانات المؤقت
        await run(`rm -f /www/wwwroot/all_databases.sql`);

        console.log('\n╔═══════════════════════════════════════════════════╗');
        console.log('║  ✅ تمت النسخة الاحتياطية الشاملة بنجاح!           ║');
        console.log(`║  📁 المسار على السيرفر: ${BACKUP_TAR} ║`);
        console.log('╚═══════════════════════════════════════════════════╝');

    } catch (e) {
        console.error('❌ خطأ:', e.message);
    } finally {
        conn.end();
    }
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    readyTimeout: 30000,
});
