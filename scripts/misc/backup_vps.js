const {Client} = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    console.log('🔄 جاري أخذ نسخة احتياطية من سيرفر namainvist.com...');
    const d = new Date();
    const ts = d.toISOString().replace(/[:.]/g, '-');
    conn.exec(`cp -a /www/wwwroot/namainvist.com /www/wwwroot/namainvist.com_backup_${ts}`, (err, stream) => {
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => {
            console.log('✅ تم الانتهاء من النسخ الاحتياطي للسيرفر بنجاح!');
            conn.end();
        });
    });
}).connect({ host:'46.4.188.170', port:22, username:'root', password:'process.env.SSH_PASSWORD' });
