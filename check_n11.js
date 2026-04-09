const { Client } = require('ssh2');
const https = require('https');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    readyTimeout: 20000
};

const conn = new Client();
console.log('🔄 جاري الاتصال بالخادم لفحص N11...');

conn.on('ready', () => {
    console.log('✅ تم الاتصال بنجاح. جاري استخراج بيانات N11...');
    
    const bashScript = `
        echo "========================================="
        echo "1. التحقق من مسار ملفات N11"
        echo "========================================="
        if [ -d "/www/wwwroot/n11.namainvist.com" ]; then
            echo "✅ ملفات N11 موجودة."
        else
            echo "❌ مجلد N11 غير موجود!"
            exit 1
        fi

        echo ""
        echo "========================================="
        echo "2. التحقق من قاعدة البيانات (ملف .env)"
        echo "========================================="
        if [ -f "/www/wwwroot/n11.namainvist.com/.env" ]; then
            DB_URL=$(grep "DATABASE_URL" /www/wwwroot/n11.namainvist.com/.env)
            if [ -z "$DB_URL" ]; then
                echo "❌ رابط قاعدة البيانات غير موجود في .env"
            else
                echo "✅ ملف .env متصل بقاعدة بيانات: $(echo $DB_URL | cut -d'@' -f2 | cut -d'/' -f1)"
            fi
        else
             echo "❌ ملف .env غير موجود في N11"
        fi

        echo ""
        echo "========================================="
        echo "3. فحص حالة N11 في PM2"
        echo "========================================="
        pm2 show n11 | grep "status"

        echo ""
        echo "========================================="
        echo "4. آخر 30 سطر من سجلات الأخطاء (Logs)"
        echo "========================================="
        pm2 logs n11 --lines 30 --nostream --err
    `;

    conn.exec(bashScript, (err, stream) => {
        if (err) throw err;
        let output = '';
        stream.on('data', (data) => {
            output += data;
        }).on('close', () => {
            console.log(output);
            conn.end();
            
            console.log('\n=========================================');
            console.log('5. فحص توفر الصفحة الرئيسية عبر الإنترنت');
            console.log('=========================================');
            https.get('https://n11.namainvist.com', (res) => {
                if (res.statusCode === 200) {
                    console.log('✅ الموقع يعمل بنجاح ويرد برمز 200 OK');
                } else {
                    console.log(`⚠️ الموقع متاح ولكنه يرد برمز: ${res.statusCode}`);
                }
            }).on('error', (e) => {
                console.log(`❌ فشل في الوصول إلى الموقع: ${e.message}`);
            });
        });
    });
}).on('error', (err) => {
    console.error('❌ فشل الاتصال بالخادم:', err.message);
}).connect(config);
