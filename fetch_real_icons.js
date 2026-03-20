const { Client } = require('ssh2');
const conn = new Client();
const bashScript = `
#!/bin/bash
echo "Downloading legitimate 192x192 and 512x512 PNG icons..."
for i in {1..10}
do
  echo "Syncing icons for n$i..."
  DIR=/www/wwwroot/n$i.namainvist.com/public
  mkdir -p $DIR
  curl -s "https://dummyimage.com/192x192/0B0E14/ffffff.png&text=POS" -o $DIR/icon-192x192.png
  curl -s "https://dummyimage.com/512x512/0B0E14/ffffff.png&text=NamaVest" -o $DIR/icon-512x512.png
done
echo "ALL APPS SYNCHED WITH TRUE GEOMETRIC ICONS!"
`;
conn.on('ready', () => {
    conn.exec('cat << "EOF" > /root/sync_icons.sh\n' + bashScript + '\nEOF\nbash /root/sync_icons.sh', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
        .on('data', (d) => process.stdout.write(d.toString()))
        .stderr.on('data', (d) => process.stderr.write(d.toString()));
    });
}).connect({
    host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b',
    readyTimeout: 30000
});
