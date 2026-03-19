const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        console.log("SFTP Ready. Uploading patch.zip...");
        sftp.fastPut('d:/namasoft9-3-main/patch.zip', '/root/patch.zip', (err) => {
            if (err) throw err;
            console.log("Upload complete.");
            const bash = `
#!/bin/bash
cd /root
unzip -o patch.zip -d /root/patch_dir
for i in {1..10}
do
  echo "Updating n$i..."
  cp -r /root/patch_dir/* /www/wwwroot/n$i.namainvist.com/
  (
    cd /www/wwwroot/n$i.namainvist.com
    npm run build > build_api.log 2>&1
    pm2 restart n$i --update-env
    pm2 restart n$i-whatsapp --update-env
  ) &
done
wait
echo "ALL DEPLOYS COMPLETE!"
            `;
            conn.exec(`echo "${bash.replace(/\n/g, '\\n')}" > /root/deploy.sh && chmod +x /root/deploy.sh && nohup /root/deploy.sh > /root/deploy.log 2>&1 &`, (err, stream) => {
                if (err) throw err;
                stream.on('close', () => {
                    console.log("Deploy script triggered successfully on background!");
                    conn.end();
                });
            });
        });
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    keepaliveInterval: 10000
});
