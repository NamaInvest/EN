const { Client } = require('ssh2');

const TODAY = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const SOURCE = '/www/wwwroot/namainvist.com';
const BACKUP = `/www/wwwroot/namainvist.com_backup_${TODAY}`;

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
        // 1. حجم المجلد الحالي
        console.log('📊 [1] حجم namainvist.com...');
        await run(`du -sh ${SOURCE} 2>&1`);

        // 2. هل النسخة الاحتياطية موجودة مسبقاً؟
        console.log(`\n🔍 [2] التحقق من وجود نسخة بتاريخ ${TODAY}...`);
        const exists = await run(`ls -la ${BACKUP} 2>/dev/null && echo "EXISTS" || echo "NOT_EXISTS"`);
        
        if (exists.includes('EXISTS')) {
            console.log(`⚠️  النسخة الاحتياطية موجودة بالفعل: ${BACKUP}`);
            console.log('🔄 سيتم استبدالها...');
            await run(`rm -rf ${BACKUP}`);
        }

        // 3. نسخ كل شيء
        console.log(`\n📋 [3] جاري النسخ الاحتياطي الكامل...`);
        console.log(`    من: ${SOURCE}`);
        console.log(`    إلى: ${BACKUP}`);
        await run(`cp -r ${SOURCE} ${BACKUP} && echo "✅ اكتملت النسخة الاحتياطية"`);

        // 4. تحقق من الحجم
        console.log('\n📊 [4] حجم النسخة الاحتياطية...');
        await run(`du -sh ${BACKUP} 2>&1`);

        // 5. قائمة النسخ الاحتياطية الموجودة
        console.log('\n📁 [5] كل النسخ الاحتياطية المتاحة...');
        await run(`ls -lh /www/wwwroot/ | grep -E "namainvist" 2>&1`);

        console.log('\n╔═══════════════════════════════════════════════════╗');
        console.log('║  ✅ تمت النسخة الاحتياطية بنجاح!               ║');
        console.log(`║  📁 المسار: ${BACKUP.padEnd(37)}║`);
        console.log(`║  📅 التاريخ: ${TODAY}                           ║`);
        console.log('║  🔒 namainvist.com الأصلي لم يُمس               ║');
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
    password: 'process.env.SSH_PASSWORD',
    readyTimeout: 20000,
});
