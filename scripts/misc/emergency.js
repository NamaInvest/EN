const { Client } = require('ssh2'); 
const conn = new Client(); 

const shScript = `#!/bin/bash
for i in 1 2 3 4 5 6 7 8 9 10; do
  (
    echo "Starting recovery for tenant n$i"
    cd /www/wwwroot/n$i.namainvist.com
    rm -rf .next
    npx prisma generate
    npx prisma db push --accept-data-loss
    npm run build
    pm2 restart n$i --update-env
    echo "Completed n$i"
  ) > /root/emergency_n$i.log 2>&1 &
done
`;

conn.on('ready', () => { 
    conn.exec(`cat << 'EOF' > /root/emergency.sh\n${shScript}\nEOF\nbash /root/emergency.sh`, (err, stream) => { 
        if (err) throw err; 
        stream.on('close', () => {
            console.log('Emergency script triggered successfully.');
            conn.end();
        });
    }); 
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 20000});
