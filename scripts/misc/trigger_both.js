const { Client } = require('ssh2');

const updateServer2 = () => {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        conn.on('ready', () => {
            console.log('Connected to VPS: 95.217.187.44');
            conn.sftp((err, sftp) => {
                if (err) return reject(err);
                
                const localFile = 'c:/Users/1/Desktop/alfa/src/components/InvoiceReceipt.tsx';
                const remoteFile = '/var/www/namasoft/src/components/InvoiceReceipt.tsx';
                
                sftp.fastPut(localFile, remoteFile, (e) => {
                    if (e) return reject(e);
                    console.log('File uploaded to 95.217.187.44.');
                    conn.end();
                    resolve();
                });
            });
        }).on('error', reject).connect({
            host: '95.217.187.44', port: 22, username: 'root', 
            privateKey: require('fs').readFileSync('C:/Users/1/.ssh/hetzner_key'),
            keepaliveInterval: 10000
        });
    });
};

const triggerBuild = (host, auth) => {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        conn.on('ready', () => {
            console.log(`Triggering build on ${host}`);
            const cmd = `cd /var/www/namasoft && rm -f /tmp/build_sync.log && nohup bash -c "npm run build > /tmp/build_sync.log 2>&1 && pm2 restart namasoft" > /dev/null 2>&1 &`;
            conn.exec(cmd, (err, stream) => {
                if (err) return reject(err);
                stream.on('close', () => {
                    conn.end(); resolve();
                });
            });
        }).on('error', reject).connect({...auth, host, port: 22, keepaliveInterval: 10000});
    });
};

async function main() {
    try {
        await updateServer2();
        await triggerBuild('185.197.195.202', { username: 'root', password: 'VmJUML2LuezRSws' });
        await triggerBuild('95.217.187.44', { username: 'root', privateKey: require('fs').readFileSync('C:/Users/1/.ssh/hetzner_key') });
        console.log('Builds triggered successfully');
    } catch (e) {
        console.error(e);
    }
}
main();
