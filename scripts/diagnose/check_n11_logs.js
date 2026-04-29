const { Client } = require('ssh2');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    readyTimeout: 30000
};

console.log('🔄 جاري فحص سجلات التشغيل المباشر لسيرفر N11...');

const conn = new Client();
conn.on('ready', () => {
    console.log('✅ تم الاتصال بحمد الله!');
    
    // Command to check memory and tail logs for n11
    const cmd = `pm2 show n11 && pm2 logs n11 --lines 50 --nostream`;
    
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            conn.end();
        }).on('data', (data) => process.stdout.write(data.toString()))
          .stderr.on('data', (data) => process.stderr.write(data.toString()));
    });
}).on('error', (err) => {
    console.error('❌ خطأ:', err);
}).connect(config);
