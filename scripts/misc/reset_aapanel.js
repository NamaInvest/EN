const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    // Reset aaPanel password to Namaa@2026
    const cmd = 'cd /www/server/panel && python tools.py panel Namaa@2026';
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.on('close', () => {
            console.log("\n✅ تم تغيير كلمة مرور aaPanel بنجاح!");
            console.log("الرابط: https://46.4.188.170:35087/99436ada");
            console.log("اسم المستخدم: 3u9dgc4z");
            console.log("كلمة المرور الجديدة: Namaa@2026");
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
