const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' };
const REMOTE_PATH = '/www/wwwroot/namainvist.com';

const FILES_TO_SYNC = [
    'src/app/api/help/route.ts',
    'scripts/generate-certificate.ts',
    'src/components/CookieConsent.tsx',
    'scripts/cron/retention-cleanup.ts',
    'prisma/schema.prisma'
];

function exec(conn, cmd) {
    return new Promise((resolve, reject) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            let stdout = '', stderr = '';
            stream.on('data', d => stdout += d);
            stream.stderr.on('data', d => stderr += d);
            stream.on('close', (code) => resolve({ code, stdout, stderr }));
        });
    });
}

function uploadFile(conn, localPath, remotePath) {
    return new Promise(async (resolve, reject) => {
        const remoteDir = remotePath.substring(0, remotePath.lastIndexOf('/'));
        await exec(conn, `mkdir -p ${remoteDir}`);
        
        conn.sftp((err, sftp) => {
            if (err) return reject(err);
            const content = fs.readFileSync(localPath);
            sftp.writeFile(remotePath, content, (err) => {
                sftp.end();
                if (err) return reject(err);
                resolve();
            });
        });
    });
}

async function main() {
    const conn = new Client();
    conn.on('ready', async () => {
        console.log('Connected to Hetzner...');
        
        for (const file of FILES_TO_SYNC) {
            console.log(`Uploading ${file}...`);
            await uploadFile(conn, path.resolve(file), `${REMOTE_PATH}/${file}`);
        }
        
        console.log('Running remote schema push for n11_db (Main SaaS DB)...');
        const dbPush = await exec(conn, `cd ${REMOTE_PATH} && DATABASE_URL="postgresql://postgres:RootPassNama123@localhost:5432/n11_db?schema=public" npx prisma db push --accept-data-loss`);
        console.log(dbPush.stdout);
        console.log(dbPush.stderr);

        console.log('Building Next.js on server...');
        const build = await exec(conn, `cd ${REMOTE_PATH} && npm run build`);
        console.log('Restarting PM2...');
        await exec(conn, `pm2 restart all`);
        
        console.log('Done!');
        conn.end();
    });
    
    conn.on('error', err => console.error(err));
    conn.connect(SERVER);
}

main();
