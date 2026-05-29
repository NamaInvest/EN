const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    // Reset both username and password securely, then print them
    const cmd = 'cd /www/server/panel && /www/server/panel/pyenv/bin/python tools.py username admin_namaa && /www/server/panel/pyenv/bin/python tools.py panel Namaa2026';
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.stderr.on('data', d => out += d.toString());
        stream.on('close', () => {
            console.log("\n✅ تم تغيير بيانات الدخول بنجاح!");
            console.log("الرابط: https://46.4.188.170:35087/99436ada");
            console.log("اسم المستخدم: admin_namaa");
            console.log("كلمة المرور: Namaa2026");
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
