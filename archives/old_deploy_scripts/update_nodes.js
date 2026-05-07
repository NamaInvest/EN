const { Client } = require('ssh2');
const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };

function execCommand(conn, cmd) {
    return new Promise((resolve, reject) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            let stdout = '', stderr = '';
            stream.on('data', d => { stdout += d; });
            stream.stderr.on('data', d => { stderr += d; });
            stream.on('close', (code) => resolve({ code, stdout, stderr }));
        });
    });
}

async function run() {
    const conn = new Client();
    conn.on('ready', async () => {
        try {
            console.log('Copying schema to all nodes and generating Prisma Client...');
            
            const nodes = [
                '/www/wwwroot/namainvist.com',
                '/www/wwwroot/n1.namainvist.com',
                '/www/wwwroot/n11.namainvist.com'
            ];

            // Master schema is in namainvist.com
            for (const node of nodes) {
                if (node !== '/www/wwwroot/namainvist.com') {
                    console.log(`Copying schema to ${node}...`);
                    await execCommand(conn, `cp /www/wwwroot/namainvist.com/prisma/schema.prisma ${node}/prisma/schema.prisma`);
                }
                
                console.log(`Generating Prisma client in ${node}...`);
                const gen = await execCommand(conn, `cd ${node} && npx prisma generate`);
                console.log(gen.stdout);
                
                console.log(`Rebuilding Next.js in ${node}...`);
                const build = await execCommand(conn, `cd ${node} && rm -rf .next && npm run build`);
                console.log(build.stdout || build.stderr);
            }

            console.log('Restarting PM2 apps...');
            await execCommand(conn, 'pm2 restart main-site n1-main saas-app');
            console.log('Done!');
        } catch (e) {
            console.error('Error:', e);
        }
        conn.end();
    });
    conn.connect(SERVER);
}

run();
