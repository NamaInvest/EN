const { Client } = require('ssh2');
const fs = require('fs');

const SSH_CONFIG = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };

const FILES = [
    { local: 'c:\\Users\\1\\Desktop\\alfa\\src\\components\\Sidebar.tsx' },
    { local: 'c:\\Users\\1\\Desktop\\alfa\\src\\app\\(dashboard)\\settings\\page.tsx' },
];

async function putFile(sftp, localPath, remotePath) {
    return new Promise((resolve, reject) => {
        const localCode = fs.readFileSync(localPath, 'utf8');
        const stream = sftp.createWriteStream(remotePath);
        stream.on('close', resolve);
        stream.on('error', reject);
        stream.write(localCode);
        stream.end();
    });
}

function execute(conn, cmd) {
    return new Promise((resolve, reject) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.stderr.on('data', d => process.stderr.write(d.toString()));
            stream.on('close', (code) => {
                if (code !== 0) reject(new Error('Exit code ' + code));
                else resolve();
            });
        });
    });
}

async function deployToServer(i) {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        conn.on('ready', () => {
            console.log(`Connected to N${i}...`);
            conn.sftp(async (err, sftp) => {
                if (err) throw err;
                try {
                    await putFile(sftp, FILES[0].local, `/www/wwwroot/n${i}.namainvist.com/src/components/Sidebar.tsx`);
                    await putFile(sftp, FILES[1].local, `/www/wwwroot/n${i}.namainvist.com/src/app/(dashboard)/settings/page.tsx`);
                    
                    console.log(`Building N${i}...`);
                    await execute(conn, `
                        pm2 stop n9 n10 whatsapp-bot1 whatsapp-bot2
                        cd /www/wwwroot/n${i}.namainvist.com
                        npx prisma generate
                        npm run build
                        pm2 restart n${i} n9 n10 whatsapp-bot1 whatsapp-bot2
                    `);
                    console.log(`Finished N${i}`);
                    conn.end();
                    resolve();
                } catch (e) {
                    console.error(`Error on N${i}:`, e);
                    conn.end();
                    resolve(); // continue anyway
                }
            });
        }).on('error', (err) => {
            console.error(`SSH Error N${i}:`, err);
            resolve();
        }).connect(SSH_CONFIG);
    });
}

async function run() {
    for (let i = 2; i <= 10; i++) {
        await deployToServer(i);
    }
    console.log('All N2-N10 deployments complete.');
}

run();
