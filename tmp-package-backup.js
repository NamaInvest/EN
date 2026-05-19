const { Client } = require('ssh2'); 
const conn = new Client(); 

const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const tarFileName = `namainvist_golden_backup_${dateStr}.tar.gz`;

const script = `
cd /www/wwwroot/namainvist.com/backups

echo "Creating combined archive..."
tar -czf ${tarFileName} n11_db_golden_${dateStr}.dump n1_db_golden_${dateStr}.dump source_code_golden_${dateStr}.tar.gz nginx_namainvist.com.conf GOLDEN_STATE_REPORT.md

echo "---"
echo "SIZE:"
ls -lh ${tarFileName} | awk '{print $5}'

echo "---"
echo "SHA256SUM:"
sha256sum ${tarFileName}
`;

conn.on('ready', () => { 
  console.log('Connected. Running packaging script...');
  conn.exec(script, (err, stream) => { 
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stderr.write(d));
    stream.on('close', () => conn.end());
  }); 
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
