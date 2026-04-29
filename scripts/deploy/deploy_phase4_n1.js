const { Client } = require('ssh2');

const updateServer = (hostIp, username, password) => {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        conn.on('ready', () => {
            console.log(`Connected to VPS: ${hostIp}`);
            
            conn.sftp((err, sftp) => {
                if (err) return reject(err);
                
                const files = [
                    'src/app/(dashboard)/sales/routes/page.tsx'
                ];
                
                let done = 0;
                for (let file of files) {
                    const localFile = `c:/Users/1/Desktop/alfa/${file}`;
                    const remoteFile = `/www/wwwroot/n1.namainvist.com/${file}`;
                    
                    sftp.fastPut(localFile, remoteFile, (e) => {
                        if (e) console.error('Upload error on', file, e);
                        done++;
                        console.log(`Uploaded ${file} (${done}/${files.length})`);
                        if (done === files.length) {
                            const cmd = `export PATH=$PATH:/www/server/nvm/versions/node/v24.14.0/bin && cd /www/wwwroot/n1.namainvist.com && rm -rf .next && npm run build && pm2 restart n1`;
                            console.log('Building on remote...');
                            conn.exec(cmd, (e2, stream) => {
                                if (e2) return reject(e2);
                                stream.on('data', d => process.stdout.write(`[${hostIp}] ${d.toString()}`));
                                stream.stderr.on('data', d => process.stdout.write(`[${hostIp}] ERR: ${d.toString()}`));
                                stream.on('close', (code) => {
                                    console.log(`[${hostIp}] Build done with code ${code}`);
                                    conn.end();
                                    resolve();
                                });
                            });
                        }
                    });
                }
            });
        }).on('error', reject);
        
        const config = { host: hostIp, port: 22, username, password, keepaliveInterval: 10000 };
        conn.connect(config);
    });
};

async function main() {
    try {
        console.log('Deploying hotfix to n1 Server...');
        await updateServer('46.4.188.170', 'root', '_ee4SWbxLVfH9b');
        console.log('Hotfix Deployment Complete!');
    } catch (e) {
        console.error('Deployment Error:', e);
    }
}

main();
