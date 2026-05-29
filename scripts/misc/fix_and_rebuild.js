const { Client } = require('ssh2');

const conn = new Client();
const PASS = 'Rbpb19adWQSKFY0qJNZhrC2F6K4OQYGQeGXUBWPwtbRWnHFIQ18Z0Erz1BLNPiK/JwnLNZsIfzNiM6NUs5GXmPYxEE4Er808XFNC11uCZ3z79101XNbH9z5E8DnpuGh6Tl1pYeEVyWVftw==';
const APP = '/www/wwwroot/namainvist.com';

conn.on('ready', () => {
    console.log('✅ متصل - جاري إصلاح .env وإعادة البناء...');

    // Step 1: Rewrite the .env cleanly (no duplicate lines, no quotes around PASS)
    const fixEnvCmd = [
        // Remove old duplicate ZEPTO/EMAIL lines
        `sed -i '/^ZEPTOMAIL_/d' ${APP}/.env`,
        `sed -i '/^EMAIL_FROM/d' ${APP}/.env`,
        // Append clean values without quotes
        `echo '' >> ${APP}/.env`,
        `echo 'ZEPTOMAIL_HOST=smtp.zeptomail.sa' >> ${APP}/.env`,
        `echo 'ZEPTOMAIL_PORT=587' >> ${APP}/.env`,
        `echo 'ZEPTOMAIL_USER=emailapikey' >> ${APP}/.env`,
        `echo 'ZEPTOMAIL_PASS=${PASS}' >> ${APP}/.env`,
        `echo 'EMAIL_FROM=noreply@namainvist.com' >> ${APP}/.env`,
        `echo 'EMAIL_FROM_NAME=Nama Invest' >> ${APP}/.env`,
    ].join(' && ');

    conn.exec(fixEnvCmd, (err, stream) => {
        if (err) throw err;
        stream.resume();
        stream.on('close', () => {
            console.log('✅ .env مُصحَّح - جاري إعادة البناء (قد يستغرق 2-3 دقائق)...');

            // Step 2: Full rebuild and restart with --update-env
            conn.exec(`cd ${APP} && npm run build 2>&1 | tail -20 && pm2 restart main-site --update-env && echo "ALL_DONE"`, (err2, stream2) => {
                if (err2) throw err2;
                stream2.on('data', d => process.stdout.write(d.toString()));
                stream2.stderr.on('data', d => process.stderr.write(d.toString()));
                stream2.on('close', () => {
                    console.log('\n✅ اكتمل بنجاح!');
                    conn.end();
                });
            });
        });
    });
}).connect({
    host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 30000
});
