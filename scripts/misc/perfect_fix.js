const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmds = `
        echo "Starting PERFECT fix..."
        for i in {2..10}; do
            dir="/www/wwwroot/n$i.namainvist.com"
            if [ -d "$dir" ]; then
                echo "Fixing .env for n$i"
                cat << EOF > $dir/.env
DATABASE_URL="postgresql://postgres:RootPassNama123@localhost:5432/n\${i}_db?schema=public"
NEXT_PUBLIC_API_URL="http://n\${i}.namainvist.com"
PORT=300\${i}
EOF
                cd $dir
                npx prisma db push --accept-data-loss
                npx tsx prisma/seed.ts || true
                pm2 restart n$i || true
            fi
        done
        echo "Done!"
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
