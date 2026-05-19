const { Client } = require('ssh2'); 
const conn = new Client(); 

const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');

const script = `
cd /www/wwwroot/namainvist.com

echo "Dumping n11_db..."
sudo -u postgres pg_dump -h localhost -p 5432 -Fc n11_db > backups/n11_db_golden_${dateStr}.dump

echo "Dumping n1_db..."
sudo -u postgres pg_dump -h localhost -p 5432 -Fc n1_db > backups/n1_db_golden_${dateStr}.dump

echo "Getting file sizes..."
ls -lh backups/
`;

conn.on('ready', () => { 
  console.log('Connected. Running DB backup...');
  conn.exec(script, (err, stream) => { 
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stderr.write(d));
    stream.on('close', () => conn.end());
  }); 
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
