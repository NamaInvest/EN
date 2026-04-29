const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const SSH_CONFIG = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 };

const files = [
    'src/app/api/sales/route.ts',
    'src/app/api/stock-transfers/route.ts',
    'src/app/api/enterprise/mrp/route.ts'
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
    console.log('✅ Connected to Fleet Server!\n');

    const dirs = [...new Set(files.map(f => path.dirname(f)))];

    for (let i = 1; i <= 11; i++) {
        const subdomain = `n${i}`;
        const appPath = `/www/wwwroot/${subdomain}.namainvist.com`;
        console.log(`\n============================`);
        console.log(`   Fixing ${subdomain} `);
        console.log(`============================\n`);

        await runCmd(conn, dirs.map(d => `mkdir -p ${appPath}/${d}`).join(' && '));

        for (const f of files) {
            const filepath = path.join(__dirname, f);
            if (fs.existsSync(filepath)) {
                const b64 = fs.readFileSync(filepath).toString('base64');
                await runCmd(conn, `echo ${b64} | base64 -d > ${appPath}/${f.replace(/\\/g, '/')}`);
                console.log(`✅ ${f} copied to ${subdomain}`);
            }
        }

        console.log(`⏳ Generating Prisma & Building ${subdomain}...`);
        await runCmd(conn, `cd ${appPath} && npx prisma generate && npm run build 2>&1 | tail -15 && pm2 restart ${subdomain}`);
        console.log(`✅ ${subdomain} DONE!`);
    }

    console.log('\n🚀 Fleet nodes N1-N11 have been built and restarted!');
    await runCmd(conn, `pm2 save`);
    conn.end();
}

main().catch(console.error);
