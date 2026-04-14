const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    console.log('✅ SSH Connected');
    // Fix: restart PM2 with correct port (3000) to match nginx, then reload nginx
    const cmd = `
pm2 delete n1-main 2>/dev/null || true
cd /www/wwwroot/n1.namainvist.com
sed -i 's/^PORT=.*/PORT=3000/' .env
pm2 start node_modules/next/dist/bin/next --name "n1-main" -- start -p 3000
pm2 save
echo "PORT_FIXED"
`;
    conn.exec(cmd, (err, stream) => {
        if(err){conn.end();return;}
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => {
            console.log('✅ Done! Site should be on port 3000 now.');
            conn.end();
        });
    });
}).connect({ host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b' });
