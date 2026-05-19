const { Client } = require('ssh2'); 
const conn = new Client(); 

const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');

const script = `
mkdir -p /www/wwwroot/namainvist.com/backups
cd /www/wwwroot/namainvist.com

echo "Dumping n11_db..."
sudo -u postgres pg_dump -Fc n11_db > backups/n11_db_golden_${dateStr}.dump

echo "Dumping n1_db..."
sudo -u postgres pg_dump -Fc n1_db > backups/n1_db_golden_${dateStr}.dump

echo "Archiving production files..."
tar -czf backups/source_code_golden_${dateStr}.tar.gz src prisma package.json package-lock.json ecosystem.config.js next.config.ts tsconfig.json .env.production 2>/dev/null || tar -czf backups/source_code_golden_${dateStr}.tar.gz src prisma package.json next.config.ts tsconfig.json

echo "Copying nginx config if exists..."
cp /www/server/panel/vhost/nginx/namainvist.com.conf backups/nginx_namainvist.com.conf 2>/dev/null || true

echo "Getting file sizes..."
ls -lh backups/
`;

conn.on('ready', () => { 
  console.log('Connected. Running backup script...');
  conn.exec(script, (err, stream) => { 
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stderr.write(d));
    stream.on('close', () => conn.end());
  }); 
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
