const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    // We will use printf instead of echo to properly format newlines, or just write them straight into the file
    const cmds = `
        echo 'Fixing .env for n2...'
        cat << 'EOF' > /www/wwwroot/n2.namainvist.com/.env
DATABASE_URL="postgresql://n2_db:n2_pass123@localhost:5432/n2_db?schema=public"
NEXT_PUBLIC_API_URL="http://n2.namainvist.com"
PORT=3002
EOF
        cd /www/wwwroot/n2.namainvist.com
        npm run db:setup
        
        echo 'Fixing .env for n3...'
        cat << 'EOF' > /www/wwwroot/n3.namainvist.com/.env
DATABASE_URL="postgresql://n3_db:n3_pass123@localhost:5432/n3_db?schema=public"
NEXT_PUBLIC_API_URL="http://n3.namainvist.com"
PORT=3003
EOF
        cd /www/wwwroot/n3.namainvist.com
        npm run db:setup
        
        pm2 restart n2 n3
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
