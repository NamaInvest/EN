const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    // Generate commands for n2 through n10
    let cmds = `echo "Starting global fix for n2-n10..."\n`;
    for (let i = 2; i <= 10; i++) {
        cmds += `
            echo "Fixing n${i}..."
            cat << 'EOF' > /www/wwwroot/n${i}.namainvist.com/.env
DATABASE_URL="postgresql://postgres:RootPassNama123@localhost:5432/n${i}_db?schema=public"
NEXT_PUBLIC_API_URL="http://n${i}.namainvist.com"
PORT=300${i}
EOF
            cd /www/wwwroot/n${i}.namainvist.com
            npx prisma db push --accept-data-loss
            npx tsx prisma/seed.ts || true
            pm2 restart n${i}
        `;
    }
    
    conn.exec(cmds, (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.stderr.on('data', d => out += d.toString());
        stream.on('close', () => {
            console.log("=== GLOBAL FIX COMPLETE ===");
            console.log(out);
            console.log("===========================");
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
