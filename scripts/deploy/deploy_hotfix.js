const { Client } = require('ssh2');

const updateServer = (hostIp, username, credentials, isKey) => {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        conn.on('ready', () => {
            console.log(`Connected to VPS: ${hostIp}`);
            conn.sftp((err, sftp) => {
                if (err) return reject(err);
                
                const localFile = 'c:/Users/1/Desktop/alfa/src/components/InvoiceReceipt.tsx';
                const remoteFile = '/var/www/namasoft/src/components/InvoiceReceipt.tsx';
                
                sftp.fastPut(localFile, remoteFile, (e) => {
                    if (e) return reject(e);
                    console.log(`File uploaded to ${hostIp}. Triggering build and restart...`);
                    
                    const cmd = `cd /var/www/namasoft && npm run build && pm2 restart namasoft`;
                    conn.exec(cmd, (e2, stream) => {
                        if (e2) return reject(e2);
                        stream.on('data', d => process.stdout.write(`[${hostIp}] ${d.toString()}`));
                        stream.on('close', (code) => {
                            console.log(`[${hostIp}] Done with code ${code}`);
                            conn.end();
                            resolve();
                        });
                    });
                });
            });
        }).on('error', reject);
        
        const config = { host: hostIp, port: 22, username, keepaliveInterval: 10000 };
        if (isKey) config.privateKey = require('fs').readFileSync(credentials);
        else config.password = credentials;
        
        conn.connect(config);
    });
};

async function main() {
    try {
        console.log('Sending hotfix to Server 1...');
        await updateServer('185.197.195.202', 'root', 'VmJUML2LuezRSws', false);
        
        console.log('Sending hotfix to Server 2...');
        await updateServer('95.217.187.44', 'root', 'C:/Users/1/.ssh/hetzner_key', true);
        
        console.log('Both servers updated successfully!');
    } catch (e) {
        console.error('Error:', e);
    }
}

main();
