const { Client } = require('ssh2');

const SSH_CONFIG = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };
const LOCAL_ROUTE_PATH = 'c:\\Users\\1\\Desktop\\alfa\\src\\app\\(dashboard)\\sales\\orders\\create\\page.tsx';

async function deployFix() {
    console.log('Initiating robust contract 404 fix deployment to n1...');
    const conn = new Client();
    conn.on('ready', () => {
        const remoteDir = "/www/wwwroot/n1.namainvist.com/src/app/\\(dashboard\\)/sales/orders/create";
        console.log('Creating directory if not exists: ' + remoteDir);
        conn.exec(`mkdir -p ${remoteDir}`, (err, stream) => {
            if (err) throw err;
            stream.on('data', () => {});
            stream.stderr.on('data', d => console.log('mkdir err:', d.toString()));
            stream.on('close', () => {
                conn.sftp((sftpErr, sftp) => {
                    if (sftpErr) throw sftpErr;
                    
                    const remoteFilePath = `/www/wwwroot/n1.namainvist.com/src/app/(dashboard)/sales/orders/create/page.tsx`;
                    
                    console.log('Directory ready. Uploading file...');
                    sftp.fastPut(LOCAL_ROUTE_PATH, remoteFilePath, errPut => {
                        if (errPut) throw Object.assign(new Error(), errPut);
                        console.log('File uploaded. Rebuilding Next.js (this will take 30-45 seconds)...');
                        
                        conn.exec(`cd /www/wwwroot/n1.namainvist.com && npm run build && pm2 restart n1`, (execErr, execStream) => {
                            if(execErr) throw execErr;
                            execStream.on('data', d => process.stdout.write(d.toString()));
                            execStream.stderr.on('data', d => {
                                const str = d.toString();
                                if(!str.includes('deprecated') && !str.includes('notice')) {
                                    process.stderr.write(str);
                                }
                            });
                            execStream.on('close', () => {
                                console.log(`\n✅ [n1] Rebuild and restart complete!`);
                                conn.end();
                                process.exit(0);
                            });
                        });
                    });
                });
            });
        });
    }).connect(SSH_CONFIG);
}

deployFix().catch(console.error);
