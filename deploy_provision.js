const { Client } = require('ssh2');
const conn = new Client();
const MAIN = '/www/wwwroot/namainvist.com';
const N11 = '/www/wwwroot/n11.namainvist.com';

const filesToDeploy = [
    {
        local: 'd:/namasoft9-3-main/src/app/api/auth/login/route.ts',
        remotes: [`${N11}/src/app/api/auth/login/route.ts`]
    },
    {
        local: 'd:/namasoft9-3-main/src/app/api/tenant/provision/route.ts',
        remotes: [`${MAIN}/src/app/api/tenant/provision/route.ts`, `${N11}/src/app/api/tenant/provision/route.ts`]
    },
    {
        local: 'd:/namasoft9-3-main/src/app/(dashboard)/company-info/page.tsx',
        remotes: [`${N11}/src/app/(dashboard)/company-info/page.tsx`]
    },
    {
        local: 'd:/namasoft9-3-main/src/app/company-info/page.tsx',
        remotes: [`${MAIN}/src/app/company-info/page.tsx`]
    },
];

conn.on('ready', () => {
    conn.sftp(async (err, sftp) => {
        if (err) { console.error(err); conn.end(); return; }

        const put = (local, remote) => new Promise((res, rej) => {
            sftp.fastPut(local, remote, {}, (e) => {
                if (e) { console.error(`❌ Failed: ${remote}`, e.message); rej(e); }
                else { console.log(`✅ Uploaded: ${remote}`); res(null); }
            });
        });

        for (const { local, remotes } of filesToDeploy) {
            for (const remote of remotes) {
                try { await put(local, remote); } catch { }
            }
        }

        conn.exec(`
cd ${MAIN}
echo "🔨 Building main-site..."
npm run build 2>&1 | tail -5
pm2 restart main-site
echo "✅ main-site done"

cd ${N11}
echo "🔨 Building saas-app..."
npm run build 2>&1 | tail -5
pm2 restart saas-app
echo "✅ saas-app done"
pm2 list
        `, (err2, stream) => {
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.stderr.on('data', d => process.stderr.write(d.toString()));
            stream.on('close', () => { console.log('\n🎉 Full deploy complete!'); conn.end(); });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
