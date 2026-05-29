const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    // الخطوة 1: شغّل البناء بـ nohup لكي يستمر بعد إغلاق SSH
    conn.exec(`
pm2 stop saas-app 2>/dev/null
rm -f /tmp/build_done.flag /tmp/build_error.flag
nohup bash -c 'cd /www/wwwroot/n11.namainvist.com && npm run build > /tmp/saas_build.log 2>&1 && pm2 start saas-app && touch /tmp/build_done.flag || touch /tmp/build_error.flag' &
echo "BUILD_STARTED: $!"
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n⏳ Build running on server (background). Polling every 15s...\n');
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });

// Poll للتحقق من اكتمال البناء
let attempts = 0;
const poll = () => {
    attempts++;
    const conn2 = new Client();
    conn2.on('ready', () => {
        conn2.exec(`
if [ -f /tmp/build_done.flag ]; then
    echo "✅ BUILD DONE"
    pm2 list
    tail -5 /tmp/saas_build.log
elif [ -f /tmp/build_error.flag ]; then
    echo "❌ BUILD FAILED"
    tail -20 /tmp/saas_build.log
else
    echo "⏳ Still building... (${attempts * 15}s elapsed)"
    tail -3 /tmp/saas_build.log 2>/dev/null
fi
        `, (err, s) => {
            let out = '';
            s.on('data', d => { out += d.toString(); process.stdout.write(d.toString()); });
            s.on('close', () => {
                conn2.end();
                if (out.includes('BUILD DONE') || out.includes('BUILD FAILED')) {
                    console.log('\n🏁 Done!');
                } else if (attempts < 30) {
                    setTimeout(poll, 15000);
                } else {
                    console.log('\n⏰ Timeout after 7.5 minutes');
                }
            });
        });
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
};

setTimeout(poll, 20000); // ابدأ الـ polling بعد 20 ثانية
