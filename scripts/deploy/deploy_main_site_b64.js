/**
 * deploy_main_site_b64.js - نشر الصفحة الرئيسية على namainvist.com عبر base64
 */
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const SSH_CONFIG = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 };
const MAIN_PATH = '/www/wwwroot/namainvist.com';

const files = [
    'src/middleware.ts',
    'src/components/GlobalAuthGuard.tsx',
    'src/app/page.tsx',
    'src/app/pharmacy/page.tsx',
    'src/app/retail/page.tsx',
    'src/app/restaurant/page.tsx',
    'src/app/factory/page.tsx',
];

async function runCmd(conn, cmd) {
    return new Promise((resolve, reject) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            let out = '';
            stream.on('close', () => resolve(out))
                .on('data', d => { out += d; process.stdout.write(d.toString()); })
                .stderr.on('data', d => process.stderr.write(d.toString()));
        });
    });
}

async function main() {
    const conn = new Client();
    await new Promise((res, rej) => conn.on('ready', res).on('error', rej).connect(SSH_CONFIG));
    console.log('✅ متصل!\n');

    // Step 1: mkdir
    const dirs = [...new Set(files.map(f => path.dirname(f)))];
    await runCmd(conn, dirs.map(d => `mkdir -p ${MAIN_PATH}/${d}`).join(' && '));

    // Step 2: Write each file via base64
    console.log('📦 كتابة الملفات...');
    for (const f of files) {
        const b64 = fs.readFileSync(path.join(__dirname, f)).toString('base64');
        await runCmd(conn, `echo ${b64} | base64 -d > ${MAIN_PATH}/${f.replace(/\\/g, '/')}`);
        console.log(`✅ ${f}`);
    }

    // Step 3: Build and restart
    console.log('\n⏳ بناء main-site...');
    await runCmd(conn, `cd ${MAIN_PATH} && npm run build 2>&1 | tail -8 && pm2 restart main-site && echo "MAIN_SITE_DONE"`);

    console.log('\n🚀 namainvist.com جاهز بالصفحة الرئيسية الجديدة!');
    conn.end();
}

main().catch(console.error);
