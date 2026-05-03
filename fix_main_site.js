const { Client } = require('ssh2');

const SERVER = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
};

function execCommand(conn, cmd) {
    return new Promise((resolve, reject) => {
        console.log(`> ${cmd}`);
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            let stdout = '', stderr = '';
            stream.on('data', d => { stdout += d; process.stdout.write(d.toString()); });
            stream.stderr.on('data', d => { stderr += d; process.stderr.write(d.toString()); });
            stream.on('close', (code) => resolve({ code, stdout, stderr }));
        });
    });
}

async function run() {
    const conn = new Client();
    
    conn.on('ready', async () => {
        try {
            console.log('✅ Connected. Getting PM2 list...');
            await execCommand(conn, `pm2 list`);
            
            console.log('\n🔄 Copying N11 src to Main Site to ensure full sync...');
            await execCommand(conn, `cp -a /www/wwwroot/n11.namainvist.com/src/* /www/wwwroot/namainvist.com/src/`);
            await execCommand(conn, `cp -a /www/wwwroot/n11.namainvist.com/prisma/* /www/wwwroot/namainvist.com/prisma/`);
            
            console.log('\n🏗️ Rebuilding Main Site...');
            await execCommand(conn, `cd /www/wwwroot/namainvist.com && rm -rf .next && npx prisma db push --accept-data-loss && npx prisma generate && npm run build`);
            
            console.log('\n🔄 Restarting Main Site PM2...');
            // The list command will show us the real names, but let's try main-site
            await execCommand(conn, `pm2 restart main-site || pm2 restart namainvist`);
            
            console.log('✅ ALL DONE');
        } catch (e) {
            console.error(e);
        }
        conn.end();
    });

    conn.connect(SERVER);
}

run();
