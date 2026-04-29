const { Client } = require('ssh2');
const config = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 60000 };
const conn = new Client();
conn.on('ready', () => {
    console.log('✅ متصل - بدء البناء...');
    conn.exec(
        `cd /www/wwwroot/n11.namainvist.com && npm run build 2>&1; echo "EXIT_CODE:$?"`,
        { pty: false },
        (err, stream) => {
            stream.on('close', () => {
                console.log('\n✅ انتهى. جارٍ إعادة التشغيل...');
                conn.exec(`pm2 restart n11 && echo "N11_RESTARTED"`, (e2, s2) => {
                    s2.on('close', () => conn.end())
                      .on('data', d => process.stdout.write(d.toString()))
                      .stderr.on('data', d => process.stderr.write(d.toString()));
                });
            }).on('data', d => process.stdout.write(d.toString()))
              .stderr.on('data', d => process.stderr.write(d.toString()));
        }
    );
}).connect(config);
