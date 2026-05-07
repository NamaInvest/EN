const { Client } = require('ssh2');

const SERVER = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
};

const TARGETS = [
    { base: '/www/wwwroot/namainvist.com', pm2: 'main-site' },
    { base: '/www/wwwroot/n1.namainvist.com', pm2: 'n1-main' },
    { base: '/www/wwwroot/n11.namainvist.com', pm2: 'saas-app' }
];

async function deployCleanSrc() {
    console.log('Connecting to server...');
    const conn = new Client();
    
    conn.on('ready', async () => {
        console.log('Connected! Starting SFTP...');
        conn.sftp(async (err, sftp) => {
            if (err) throw err;
            
            for (const target of TARGETS) {
                console.log(`\n--- Deploying src_clean.zip to ${target.base} ---`);
                
                // 1. Upload zip
                console.log('Uploading src_clean.zip...');
                await new Promise((resolve, reject) => {
                    sftp.fastPut('src_clean.zip', `${target.base}/src.zip`, (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
                console.log('Upload complete.');

                // 2. Unzip safely
                console.log('Extracting and replacing...');
                await new Promise((resolve, reject) => {
                    const cmd = `cd ${target.base} && unzip -oq src.zip && rm src.zip`;
                    conn.exec(cmd, (err, stream) => {
                        if (err) reject(err);
                        stream.on('data', d => console.log(d.toString().trim()));
                        stream.stderr.on('data', d => console.error(d.toString().trim()));
                        stream.on('close', resolve);
                    });
                });

                // 3. Build and restart
                console.log(`Building Next.js and restarting ${target.pm2}...`);
                await new Promise((resolve, reject) => {
                    const cmd = `cd ${target.base} && npx prisma generate && npm run build && pm2 restart ${target.pm2}`;
                    conn.exec(cmd, (err, stream) => {
                        if (err) reject(err);
                        stream.on('data', d => console.log(d.toString().trim()));
                        stream.stderr.on('data', d => console.error(d.toString().trim()));
                        stream.on('close', resolve);
                    });
                });
                console.log(`${target.pm2} updated successfully!`);
            }
            
            console.log('\nFULL SECURE DEPLOYMENT FINISHED!');
            conn.end();
        });
    }).connect(SERVER);
}

deployCleanSrc();
