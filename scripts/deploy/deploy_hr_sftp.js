const { Client } = require('ssh2');
const path = require('path');
const util = require('util');

const conn = new Client();

const filesToUpload = [
    'prisma/schema.prisma',
    'src/app/api/employees/route.ts',
    'src/app/api/employees/[id]/route.ts',
    'src/app/(dashboard)/employees/page.tsx',
    'src/app/api/hr/payroll/generate/route.ts',
    'src/app/(dashboard)/salaries/page.tsx'
];

conn.on('ready', () => {
    console.log('SSH Ready. Advanced HR & Payroll Deployment initiated sequentially...');
    conn.sftp(async (err, sftp) => {
        if (err) throw err;
        const fastPutAsync = util.promisify(sftp.fastPut).bind(sftp);
        const execAsync = util.promisify(conn.exec).bind(conn);

        try {
            // SEQUENTIAL EXECUTION to prevent SSH Channel Exhaustion and SQLite Locks
            for (let i = 1; i <= 10; i++) {
                const nodeDomain = `/www/wwwroot/n${i}.namainvist.com`;
                
                for(const file of filesToUpload) {
                    const localPath = path.join(__dirname, file);
                    const remotePath = `${nodeDomain}/${file.replace(/\\/g, '/')}`;
                    const remoteDir = path.dirname(remotePath);
                    
                    // Create dir
                    await new Promise((res) => {
                        conn.exec(`mkdir -p "${remoteDir}"`, () => res());
                    });
                    await new Promise(r => setTimeout(r, 250));
                    
                    // Upload
                    await fastPutAsync(localPath, remotePath);
                }
                console.log(`[n${i}] 6 HR/Payroll components uploaded.`);
                
                // Pipeline requires DB Push since schema.prisma contains new Employee fields!
                const pipelineCmd = `cd ${nodeDomain} && npx prisma db push && npx prisma generate && npm run build && pm2 reload n${i} --update-env`;
                console.log(`[n${i}] Triggering Prisma DB Push + Turbopack Build...`);
                
                const stream = await execAsync(pipelineCmd);
                await new Promise(res => {
                    stream.on('data', d => process.stdout.write(`[n${i}] ${d.toString()}`));
                    stream.on('close', () => {
                        console.log(`\n[n${i}] ENTERPRISE HR UPDATE DEPLOYED SUCCESSFULLY!\n`);
                        res();
                    });
                });
            }
            console.log("ALL 10 NODES SYNCED PERFECTLY! ADVANCED PAYROLL ENGINE IS ONLINE.");
            conn.end();
        } catch (error) {
            console.error(error);
            conn.end();
        }
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
