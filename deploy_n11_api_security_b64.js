const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const SSH_CONFIG = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 };
const N11_PATH = '/www/wwwroot/n11.namainvist.com';

const files = [
    'src/app/api/sales/route.ts',
    'src/app/api/stock-transfers/route.ts',
    'src/app/api/enterprise/mrp/route.ts',
    'package.json'
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
    console.log('✅ متصل بـ N11!\n');

    const dirs = [...new Set(files.map(f => path.dirname(f)))];
    await runCmd(conn, dirs.map(d => `mkdir -p ${N11_PATH}/${d}`).join(' && '));

    console.log('📦 كتابة الملفات لمسار N11...');
    for (const f of files) {
        const b64 = fs.readFileSync(path.join(__dirname, f)).toString('base64');
        await runCmd(conn, `echo ${b64} | base64 -d > ${N11_PATH}/${f.replace(/\\/g, '/')}`);
        console.log(`✅ ${f}`);
    }

    console.log('\n⏳ بناء n11...');
    await runCmd(conn, `cd ${N11_PATH} && npm install && npx prisma generate && npm run build 2>&1 | tail -15 && pm2 restart n11 && echo "N11_DONE"`);

    console.log('\n🚀 تم تفعيل التحديثات الأمنية بنجاح على N11!');
    conn.end();
}

main().catch(console.error);
