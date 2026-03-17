const { Client } = require('ssh2');
const fs = require('fs');

const hostIp = '204.168.144.74';
const conn = new Client();

conn.on('ready', () => {
    console.log('Connected to VPS: ' + hostIp);

    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        console.log('Uploading src.zip...');
        sftp.fastPut('d:/namasoft9-3-main/src.zip', '/var/www/namasoft/src.zip', (e) => {
            if (e) throw e;
            console.log('Zip uploaded. Executing remote build...');
            
            // Execute the build commands sequentially and stream the output
            const cmd = `
                cd /var/www/namasoft &&
                unzip -q -o src.zip &&
                echo "--- Database Status ---" &&
                npx prisma db push --accept-data-loss &&
                echo "--- Generating Client ---" &&
                npx prisma generate &&
                echo "--- Starting NPM Build ---" &&
                rm -rf .next &&
                npm run build &&
                echo "--- Restarting Service ---" &&
                pm2 restart namasoft
            `;
            
            conn.exec(cmd, (e2, stream) => {
                if(e2) throw e2;
                
                stream.on('data', (d) => process.stdout.write(d.toString()));
                stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
                
                stream.on('close', (code) => {
                    console.log('Build script exited with code: ' + code);
                    conn.end();
                });
            });
        });
    });

}).on('error', (err) => {
    console.error('Connection error:', err);
    process.exit(1);
}).connect({
    host: hostIp, port: 22, username: 'root', privateKey: fs.readFileSync('C:/Users/1/Desktop/namasoftkey/namasoft_key'), keepaliveInterval: 10000
});
