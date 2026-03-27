const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('--- SYNCHRONIZING ZATCA SDK FROM N1 TO N2-N10 ---');
    const bashScript = `
nohup sh -c '
echo "Starting universal ZATCA SDK sync..." > /tmp/sync_zatca.log
apt-get update >> /tmp/sync_zatca.log 2>&1
apt-get install -y sshpass >> /tmp/sync_zatca.log 2>&1

IP_PREFIX="46.4.188."
declare -A IPs=(
  [2]="170" [3]="173" [4]="174" [5]="178"
  [6]="180" [7]="185" [8]="186" [9]="190" [10]="181"
)

cd /usr/local
tar -czf zatca_pack.tar.gz zatca/ bin/fatoora
echo "SDK Packaged." >> /tmp/sync_zatca.log

PASSWORD="_ee4SWbxLVfH9b"

for i in {2..10}; do
  TARGET="\${IP_PREFIX}\${IPs[$i]}"
  echo "Distributing to N$i ($TARGET)..." >> /tmp/sync_zatca.log
  
  sshpass -p "\$PASSWORD" scp -o StrictHostKeyChecking=no /usr/local/zatca_pack.tar.gz root@$TARGET:/usr/local/zatca_pack.tar.gz
  sshpass -p "\$PASSWORD" ssh -o StrictHostKeyChecking=no root@$TARGET "cd /usr/local && tar -xzf zatca_pack.tar.gz && rm zatca_pack.tar.gz && chmod +x /usr/local/bin/fatoora"
done

echo "Global ZATCA SDK Distribution Complete!" >> /tmp/sync_zatca.log
' > /dev/null 2>&1 &
    `;
    
    // Quick single push from N1 specifically to N2 so we can test INSTANTLY while others run in background
    const quickN2 = `
apt-get update && apt-get install -y sshpass
cd /usr/local
tar -czf zatca_pack.tar.gz zatca/ bin/fatoora
sshpass -p "_ee4SWbxLVfH9b" scp -o StrictHostKeyChecking=no /usr/local/zatca_pack.tar.gz root@46.4.188.170:/usr/local/zatca_pack.tar.gz
sshpass -p "_ee4SWbxLVfH9b" ssh -o StrictHostKeyChecking=no root@46.4.188.170 "cd /usr/local && tar -xzf zatca_pack.tar.gz && rm zatca_pack.tar.gz && chmod +x /usr/local/bin/fatoora"
echo "N2 SYNCHRONIZED INSTANTLY!"
`;

    conn.exec(quickN2, (err, stream2) => {
        stream2.on('close', () => {
            console.log('✅ N2 NOW HAS THE FULL ZATCA SDK! Triggering global background sync for others...');
            conn.exec(bashScript, (err, stream) => {
                stream.on('close', () => conn.end());
            });
        }).on('data', d => process.stdout.write(d.toString()));
    });

}).connect({host: '46.4.188.169', port: 22, username: 'root', password: 'M9_4G7eCqZtU2nVh', readyTimeout: 20000});
