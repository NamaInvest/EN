const { Client } = require('ssh2');

const keys = `
ZEPTOMAIL_HOST=smtp.zeptomail.sa
ZEPTOMAIL_PORT=587
ZEPTOMAIL_USER=emailapikey
ZEPTOMAIL_PASS="Rbpb19adWQSKFY0qJNZhrC2F6K4OQYGQeGXUBWPwtbRWnHFIQ18Z0Erz1BLNPiK/JwnLNZsIfzNiM6NUs5GXmPYxEE4Er808XFNC11uCZ3z79101XNbH9z5E8DnpuGh6Tl1pYeEVyWVftw=="
EMAIL_FROM=noreply@namainvist.com
EMAIL_FROM_NAME="Nama Invest"
`;

const conn = new Client();

conn.on('ready', () => {
    console.log('✅ متصل - جاري تحديث .env...');
    const cmd = `echo '${keys.replace(/'/g, "'\\''")}' >> /www/wwwroot/namainvist.com/.env && pm2 restart main-site --update-env`;
    
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            console.log('✅ تم التحديث بنجاح.');
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data.toString());
        }).stderr.on('data', (data) => {
            process.stderr.write(data.toString());
        });
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    readyTimeout: 30000
});
