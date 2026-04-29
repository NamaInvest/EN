const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmds = `
        echo "=== NAMA SaaS FLEET HEALTH CHECK ==="
        for i in {1..10}; do
            PORT=300$i
            if [ $i -eq 10 ]; then PORT=3010; fi
            DB="n\${i}_db"
            URL="http://127.0.0.1:\${PORT}/api/auth/csrf"
            
            echo -n "[n$i] PM2 Status    : "
            PM2_STAT=$(pm2 jlist | grep -o "\\"name\\":\\"n$i\\",[^\\]]*\\"status\\":\\"[^\\"]*\\"" | grep -o "online" || echo "OFFLINE")
            if [ "$PM2_STAT" = "online" ]; then echo "🟢 ONLINE"; else echo "🔴 OFFLINE"; fi
            
            echo -n "[n$i] HTTP Server : "
            HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $URL || echo "FAILED")
            if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "404" ]; then echo "🟢 RESPONDING (Code: $HTTP_CODE)"; else echo "🔴 FAILED"; fi
            
            echo -n "[n$i] PostgreSQL  : "
            ADMIN_EXISTS=$(sudo -u postgres psql -t -d $DB -c 'SELECT COUNT(*) FROM "User" WHERE username='\''admin'\'';' 2>/dev/null | tr -d ' ')
            if [ "$ADMIN_EXISTS" = "1" ]; then echo "🟢 SEEDED (Admin exists)"; else echo "🔴 ERROR or NOT SEEDED"; fi
            
            echo "--------------------------------"
        done
        echo "=== END OF REPORT ==="
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
    password: '_ee4SWbxLVfH9b',
    keepaliveInterval: 10000
});
