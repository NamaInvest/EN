const { Client } = require('ssh2');

const SSH_CONFIG = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 };
const mainPath = '/www/wwwroot/namainvist.com';

const cmd = `
cd ${mainPath}
npm install nodemailer @types/nodemailer
npm run build 2>&1 | tail -n 15
pm2 restart main-site
echo "DONE_DEPLOY"
`;

const conn = new Client();
conn.on('ready', () => {
    console.log('✅ متصل - جاري تثبيت المكتبات وتحديث البناء...');
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            console.log('✅ اكتمل التحديث');
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data.toString());
        }).stderr.on('data', (data) => {
            process.stderr.write(data.toString());
        });
    });
}).connect(SSH_CONFIG);
