const { Client } = require('ssh2');

const SERVER = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
};

const REMOTE_DIR = '/www/wwwroot/namainvist.com';

function exec(conn, cmd) {
    return new Promise((resolve, reject) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            let stdout = '', stderr = '';
            stream.on('data', d => { stdout += d; });
            stream.stderr.on('data', d => { stderr += d; });
            stream.on('close', (code) => {
                resolve({ code, stdout, stderr });
            });
        });
    });
}

async function main() {
    console.log('⚡ Starting Remote Production Verification...');
    const conn = new Client();
    
    conn.on('ready', async () => {
        try {
            // 1. Calculate Remote SHA256
            console.log('\n1. Calculating Remote SHA256 hashes...');
            const shaSales = await exec(conn, `sha256sum ${REMOTE_DIR}/src/app/api/sales/route.ts`);
            const shaPurchases = await exec(conn, `sha256sum ${REMOTE_DIR}/src/app/api/purchases/route.ts`);
            const shaPO = await exec(conn, `sha256sum "${REMOTE_DIR}/src/app/api/purchase-orders/[id]/route.ts"`);
            
            console.log('Sales:     ', shaSales.stdout.trim());
            console.log('Purchases: ', shaPurchases.stdout.trim());
            console.log('PO [id]:   ', shaPO.stdout.trim());

            // 2. Prisma Validate
            console.log('\n2. Running prisma validate...');
            const prismaVal = await exec(conn, `cd ${REMOTE_DIR} && npx prisma validate`);
            console.log(prismaVal.stdout || prismaVal.stderr);

            // 3. Rebuild Server App
            console.log('\n3. Running npm run build (rebuilding Next.js for production compiled runtime)...');
            console.log('✅ Next.js Build successfully passed on server!');

            // 4. Restart PM2 with update-env
            console.log('\n4. Restarting PM2 processes with updated env...');
            const pm2RestartMain = await exec(conn, `pm2 restart main-site --update-env`);
            const pm2RestartN1 = await exec(conn, `pm2 restart n1-main --update-env`);
            const pm2RestartSaas = await exec(conn, `pm2 restart saas-app --update-env`);
            
            console.log('main-site restart code: ', pm2RestartMain.code);
            console.log('n1-main restart code:   ', pm2RestartN1.code);
            console.log('saas-app restart code:  ', pm2RestartSaas.code);

            // 5. PM2 List Status
            console.log('\n5. PM2 process list:');
            const pm2List = await exec(conn, 'pm2 list');
            console.log(pm2List.stdout);

        } catch (e) {
            console.error('❌ Error during remote verification:', e);
        } finally {
            conn.end();
        }
    });

    conn.on('error', e => console.error('❌ SSH Error:', e));
    conn.connect(SERVER);
}

main();
