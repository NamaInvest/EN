const { Client } = require('ssh2');
const fs = require('fs');
const conn = new Client();

const schemaText = fs.readFileSync('prisma/schema.prisma', 'utf8').replace(/'/g, "'\\''").replace(/\$/g, "\\$");

const bashScript = `
#!/bin/bash
echo "Upgrading Database Architectures for Bin Tracking..."
for i in {1..10}
do
  echo "Pushing schema to Node $i..."
  cd /www/wwwroot/n$i.namainvist.com
  echo '${schemaText}' > prisma/schema.prisma
  npx prisma generate
  npx prisma db push --accept-data-loss
  pm2 reload n$i --update-env
done
echo "DATABASE MIGRATIONS COMPLETE ACROSS ALL TENANTS!"
`;

conn.on('ready', () => {
    conn.exec('cat << "EOF" > /root/upgrade_schema.sh\n' + bashScript + '\nEOF\nbash /root/upgrade_schema.sh', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            console.log("Schema propagation script complete.");
            conn.end();
            process.exit();
        })
        .on('data', (d) => process.stdout.write(d.toString()))
        .stderr.on('data', (d) => process.stderr.write(d.toString()));
    });
}).connect({
    host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD',
    readyTimeout: 30000
});
