const { Client } = require('ssh2');

const conn = new Client();
const APP = '/www/wwwroot/namainvist.com';

conn.on('ready', () => {
    console.log('✅ متصل بالخادم لحل مشكلة Sentry...');
    conn.exec(`cd ${APP} && npm install @sentry/nextjs @sentry/node @sentry/react @sentry/browser && pm2 restart main-site && echo "DONE"`, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({
    host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000
});
