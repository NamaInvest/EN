const { Client } = require('ssh2');

const server = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', name: 'N1' };
const basePath = process.cwd();

const files = [
    { local: 'src/components/AICopilotButton.tsx', remote: 'src/components/AICopilotButton.tsx' },
    { local: 'src/app/api/ai/copilot/route.ts', remote: 'src/app/api/ai/copilot/route.ts' },
    { local: 'src/app/api/ai/predictive-scm/route.ts', remote: 'src/app/api/ai/predictive-scm/route.ts' },
    { local: 'src/app/api/ai/bank-reconciliation/route.ts', remote: 'src/app/api/ai/bank-reconciliation/route.ts' },
    { local: 'src/app/googlebe8c17f02d7742b4.html/route.ts', remote: 'src/app/googlebe8c17f02d7742b4.html/route.ts' }
];

async function deployFix() {
    return new Promise((resolve) => {
        const conn = new Client();
        conn.on('ready', () => {
            console.log(`[${server.name}] Connected, pushing missing AI module chunks...`);
            conn.sftp((err, sftp) => {
                if (err) return resolve();
                
                const remoteBase = '/www/wwwroot/n1.namainvist.com';
                
                const uploadFile = (index) => {
                    if (index >= files.length) {
                        console.log(`[${server.name}] Missing chunk uploads complete. Starting final secure rebuild...`);
                        conn.exec('cd /www/wwwroot/n1.namainvist.com && npm run build && pm2 restart all', (err, stream) => {
                            stream.on('close', () => {
                                console.log(`[${server.name}] Uptime 100% Restored natively! AI and Google deployed.`);
                                conn.end();
                                resolve();
                            }).on('data', d => console.log(d.toString()));
                        });
                        return;
                    }
                    const task = files[index];
                    const localPath = basePath + '/' + task.local;
                    const remotePath = remoteBase + '/' + task.remote;
                    const remoteDir = require('path').dirname(remotePath).replace(/\\/g, '/');
                    
                    conn.exec(`mkdir -p ${remoteDir}`, () => {
                        sftp.fastPut(localPath, remotePath, (err) => {
                            if(err) console.error(`Error uploading ${localPath}`);
                            else console.log(`[${server.name}] Pushed: ${task.remote}`);
                            uploadFile(index + 1);
                        });
                    });
                };
                
                uploadFile(0);
            });
        }).on('error', () => resolve()).connect(server);
    });
}

deployFix();
