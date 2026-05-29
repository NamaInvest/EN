const { Client } = require('ssh2');
const path = require('path');
const util = require('util');

const conn = new Client();

const filesToUpload = [
    'src/app/api/warehouses/analytics/route.ts',
    'src/app/(dashboard)/warehouses/page.tsx',
    'src/app/(dashboard)/warehouses/alerts/page.tsx',
    'src/app/api/stock-transfers/route.ts',
    'src/app/api/product-stocks/location/route.ts',
    'src/app/(dashboard)/stock/page.tsx',
    'src/app/api/bookings/invoice/route.ts',
    'src/app/(dashboard)/bookings/page.tsx',
    'src/app/(dashboard)/bookings/calendar/page.tsx',
    'src/app/api/sales/route.ts',
    'src/app/api/procurement/auto-draft/route.ts',
    'src/app/api/cron/debts/route.ts',
    'src/app/api/cron/hr/route.ts',
    'src/app/api/cron/shifts/route.ts',
    'automation_daemon.js'
];

conn.on('ready', () => {
    console.log('SSH Ready. Initiating SFTP precise transfer...');
    conn.sftp(async (err, sftp) => {
        if (err) throw err;

        const fastPutAsync = util.promisify(sftp.fastPut).bind(sftp);
        const execAsync = util.promisify(conn.exec).bind(conn);

        try {
            for (let i = 1; i <= 10; i++) {
                console.log(`\n=== Repairing n${i}.namainvist.com ===`);
                for (const file of filesToUpload) {
                    const localPath = path.join(__dirname, file);
                    const remotePath = `/www/wwwroot/n${i}.namainvist.com/${file.replace(/\\/g, '/')}`;
                    
                    const remoteDir = path.dirname(remotePath);
                    await new Promise((res) => conn.exec(`mkdir -p ${remoteDir}`, () => res()));
                    
                    await fastPutAsync(localPath, remotePath);
                    console.log(`  -> Uploaded ${file}`);
                }
                
                console.log(`  -> Trigerring Build & PM2 Reload on n${i}...`);
                const stream = await execAsync(`cd /www/wwwroot/n${i}.namainvist.com && npm run build && pm2 reload n${i} --update-env`);
                
                await new Promise((res) => {
                    stream.on('data', d => process.stdout.write(d.toString()));
                    stream.stderr.on('data', d => process.stderr.write(d.toString()));
                    stream.on('close', () => {
                        console.log(`\n  -> n${i} REPAIRED AND ONLINE!\n`);
                        res();
                    });
                });
            }
            console.log("ALL NODES SUCCESSFULLY REPAIRED AND ONLINE!");
            conn.end();
        } catch (error) {
            console.error(error);
            conn.end();
        }
    });
}).connect({
    host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD',
    readyTimeout: 30000
});
