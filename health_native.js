const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmds = `
        cat << 'EOF' > /tmp/health.js
const { execSync } = require('child_process');
console.log("=== NAMA SaaS FLEET HEALTH CHECK ===");
for (let i = 1; i <= 10; i++) {
    const name = "n" + i;
    const port = (i === 10) ? 3010 : 3000 + i;
    const db = name + "_db";
    let status = "🔴 ERROR";
    let dbStatus = "🔴 ERROR";
    let httpStatus = "🔴 ERROR";
    
    try {
        const pm2List = JSON.parse(execSync("pm2 jlist").toString());
        const proc = pm2List.find(p => p.name === name);
        if (proc && proc.pm2_env.status === 'online') status = "🟢 ONLINE";
        else status = "🔴 OFFLINE";
    } catch(e) {}
    
    try {
        const res = execSync("curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:" + port).toString();
        if (res === "200" || res === "307" || res === "308" || res === "401") httpStatus = "🟢 RESPONDING (" + res + ")";
        else httpStatus = "🔴 FAILED (" + res + ")";
    } catch(e) {}
    
    try {
        // Query Postgres safely
        const psql = execSync("sudo -u postgres psql -t -d " + db + " -c 'SELECT COUNT(*) FROM \\"User\\" WHERE username=\\'admin\\';' 2>/dev/null").toString().trim();
        if (psql === "1") dbStatus = "🟢 SEEDED (Admin exists)";
        else if (psql === "0") dbStatus = "🟡 NOT SEEDED (No Admin)";
    } catch(e) {}
    
    console.log("[" + name + "] PM2: " + status + " | HTTP: " + httpStatus + " | DB: " + dbStatus);
}
console.log("====================================");
EOF
        node /tmp/health.js
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
