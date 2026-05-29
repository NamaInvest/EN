const { Client } = require('ssh2');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: 'process.env.SSH_PASSWORD',
    readyTimeout: 30000
};

const cmd = `
#!/bin/bash
set -e
echo "🔎 VERIFICATION OF ISOLATION FOR ALL SERVERS"
echo "============================================="
nodes=(1 2 3 4 5 6 8 9 10 11)

for i in "\${nodes[@]}"; do
    env_file="/www/wwwroot/n\${i}.namainvist.com/.env"
    db_url=$(grep DATABASE_URL "$env_file" || echo "MISSING")
    port=$(grep PORT= "$env_file" || echo "MISSING")
    echo "🔥 [N$i] -> DB: $db_url | PORT: $port"
done
echo "============================================="
`;

const conn = new Client();
conn.on('ready', () => {
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end());
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
    });
}).on('error', console.error).connect(config);
