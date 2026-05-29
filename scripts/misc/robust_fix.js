const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmds = `
        echo "Starting robust global fix..."
        for i in {2..10}; do
            echo "Processing n$i..."
            dir="/www/wwwroot/n$i.namainvist.com"
            if [ -d "$dir" ]; then
                echo "\\nDATABASE_URL=\\"postgresql://postgres:RootPassNama123@localhost:5432/n\${i}_db?schema=public\\"\\nNEXT_PUBLIC_API_URL=\\"http://n\${i}.namainvist.com\\"\\nPORT=300\${i}" > $dir/.env
                cd $dir
                npx prisma db push --accept-data-loss || echo "Prisma push failed for n$i"
                npx tsx prisma/seed.ts || echo "Seed failed for n$i"
                pm2 restart n$i || echo "PM2 restart failed for n$i"
            else
                echo "Directory $dir not found, skipping."
            fi
        done
        echo "All done!"
    `;
    conn.exec(cmds, (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.stderr.on('data', d => out += d.toString());
        stream.on('close', () => {
            console.log(out);
            conn.end();
        });
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: 'process.env.SSH_PASSWORD',
    keepaliveInterval: 10000
});
