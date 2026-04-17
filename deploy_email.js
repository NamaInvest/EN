const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const SSH_CONFIG = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 };
const mainPath = '/www/wwwroot/namainvist.com';

const f1 = fs.readFileSync(path.join(__dirname, 'src/app/api/email/route.ts')).toString('base64');
const f2 = fs.readFileSync(path.join(__dirname, 'src/lib/email.ts')).toString('base64');

const cmd = `
mkdir -p ${mainPath}/src/app/api/email
mkdir -p ${mainPath}/src/lib
echo "${f1}" | base64 -d > ${mainPath}/src/app/api/email/route.ts
echo "${f2}" | base64 -d > ${mainPath}/src/lib/email.ts
cd ${mainPath}
npm run build 2>&1 | tail -n 10
pm2 restart main-site
echo "DONE_DEPLOY"
`;

const conn = new Client();
conn.on('ready', () => {
    console.log('✅ متصل - جاري تجهيز المجلدات والبناء...');
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            console.log('✅ اكتمل');
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data.toString());
        }).stderr.on('data', (data) => {
            process.stderr.write(data.toString());
        });
    });
}).connect(SSH_CONFIG);
