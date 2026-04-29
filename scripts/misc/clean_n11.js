const { Client } = require('ssh2');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    readyTimeout: 30000
};

console.log('🔄 جاري الاتصال بخادم N11 لإجراء بناء نظيف تماماً (Clean Build)...');

const conn = new Client();
conn.on('ready', () => {
    console.log('✅ تم الاتصال!');
    console.log('🧹 جاري مسح الكاشات القديمة وإعادة البناء...');
    
    // Completely nuke .next to force Turbopack/Webpack to recompile ALL chunks
    conn.exec(`cd /www/wwwroot/n11.namainvist.com && rm -rf .next && npm run build && pm2 restart n11`, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            console.log('🚀 تمت عملية البناء النظيف وإعادة التشغيل بنجاح مدوي!');
            conn.end();
        }).on('data', (data) => process.stdout.write(data.toString()))
          .stderr.on('data', (data) => process.stderr.write(data.toString()));
    });
}).on('error', (err) => {
    console.error('❌ خطأ في الاتصال:', err);
}).connect(config);
