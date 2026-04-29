const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmds = `
        echo "Resetting postgres root password..."
        sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'RootPassNama123';"
        
        echo "Creating .env for n2 to use root postgres user..."
        cat << 'EOF' > /www/wwwroot/n2.namainvist.com/.env
DATABASE_URL="postgresql://postgres:RootPassNama123@localhost:5432/n2_db?schema=public"
NEXT_PUBLIC_API_URL="http://n2.namainvist.com"
PORT=3002
EOF

        echo "Testing prisma push for n2 with postgres root..."
        cd /www/wwwroot/n2.namainvist.com
        npx prisma db push --accept-data-loss
        npx tsx prisma/seed.ts
    `;
    conn.exec(cmds, (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.stderr.on('data', d => out += d.toString());
        stream.on('close', () => {
            console.log("=== ROOT PRISMA TEST ===");
            console.log(out);
            console.log("========================");
            conn.end();
        });
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    keepaliveInterval: 10000
});
