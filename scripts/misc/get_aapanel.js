const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    // Read the file where aaPanel stores the unmasked default password
    conn.exec('cat /www/server/panel/default.pl', (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.on('close', () => {
            console.log("\n--- بيانات الدخول الحقيقية لـ aaPanel ---\n");
            console.log("الرابط: https://46.4.188.170:35087/99436ada");
            console.log("اسم المستخدم: 3u9dgc4z");
            console.log("كلمة المرور: " + out.trim());
            console.log("\n-----------------------------------------");
            conn.end();
        });
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: 'process.env.SSH_PASSWORD',
    keepaliveInterval: 10000
});
