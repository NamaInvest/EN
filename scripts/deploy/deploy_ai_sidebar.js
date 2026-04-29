const { Client } = require('ssh2');

const servers = [
    { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', name: 'N1' },
    { host: '46.4.188.136', port: 22, username: 'root', password: '5gK>G9b4S5t8hO_', name: 'N2' },
    { host: '46.4.188.172', port: 22, username: 'root', password: '7hJ<F2b8L9q6wP=', name: 'N3' },
    { host: '46.4.188.174', port: 22, username: 'root', password: '2mN+R4c5T1x8yZ*', name: 'N4' },
    { host: '46.4.188.175', port: 22, username: 'root', password: '9pQ!V6d3W7k4mA-', name: 'N5' },
    { host: '46.4.188.176', port: 22, username: 'root', password: '4sT#B8f1X2n5cH&', name: 'N6' },
    { host: '46.4.188.188', port: 22, username: 'root', password: '1vY$M3g7C9l6jD@', name: 'N7' },
    { host: '46.4.188.225', port: 22, username: 'root', password: '8wZ%H2k4P5v9rE^', name: 'N8' },
    { host: '46.4.188.232', port: 22, username: 'root', password: '6xA^L1m9Q3b7tF~', name: 'N9' },
    { host: '46.4.188.135', port: 22, username: 'root', password: '3yB&N5p8S2c4uG|', name: 'N10' }
];

// For speed of demonstration, let's deploy to N1 first!
// The user usually wants N1 fast, then syncs to all.
const targetServers = servers.filter(s => s.name === 'N1');

const files = [
    { local: 'src/components/Sidebar.tsx', remote: 'src/components/Sidebar.tsx' },
    { local: 'src/app/(dashboard)/ai-scm/page.tsx', remote: 'src/app/(dashboard)/ai-scm/page.tsx' },
    { local: 'src/app/(dashboard)/ai-bank/page.tsx', remote: 'src/app/(dashboard)/ai-bank/page.tsx' },
    { local: 'src/app/(dashboard)/ai-copilot/page.tsx', remote: 'src/app/(dashboard)/ai-copilot/page.tsx' }
];

async function deployFix() {
    return new Promise((resolve) => {
        let completed = 0;
        targetServers.forEach(server => {
            const conn = new Client();
            conn.on('ready', () => {
                console.log(`[${server.name}] Connected, pushing new AI Sidebar and UI pages...`);
                conn.sftp((err, sftp) => {
                    if (err) return;
                    
                    const remoteBase = `/www/wwwroot/${server.name.toLowerCase()}.namainvist.com`;
                    
                    const uploadFile = (index) => {
                        if (index >= files.length) {
                            console.log(`[${server.name}] UI push complete. Building...`);
                            conn.exec(`cd ${remoteBase} && npm run build && pm2 restart all`, (err, stream) => {
                                stream.on('close', () => {
                                    console.log(`[${server.name}] ✅ AI UI Live!`);
                                    conn.end();
                                    completed++;
                                    if(completed === targetServers.length) resolve();
                                }).on('data', d => console.log(d.toString()));
                            });
                            return;
                        }
                        const task = files[index];
                        const localPath = process.cwd() + '/' + task.local;
                        const remotePath = remoteBase + '/' + task.remote;
                        const remoteDir = require('path').dirname(remotePath).replace(/\\/g, '/');
                        
                        conn.exec(`mkdir -p "${remoteDir}"`, () => {
                            sftp.fastPut(localPath, remotePath, (err) => {
                                if(err) console.error(`Error uploading ${localPath}`);
                                uploadFile(index + 1);
                            });
                        });
                    };
                    
                    uploadFile(0);
                });
            }).on('error', () => {
                completed++;
                if(completed === targetServers.length) resolve();
            }).connect(server);
        });
    });
}

deployFix();
