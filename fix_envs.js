const { Client } = require('ssh2');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    readyTimeout: 30000
};

const cmd = `
#!/bin/bash
set -e
echo "Checking and patching .env files across N1-N10!"

for i in {1..10}; do
    env_file="/www/wwwroot/n\${i}.namainvist.com/.env"
    
    if [ ! -f "$env_file" ]; then
        echo "Missing .env for N$i"
        continue
    fi
    
    target_db="n\${i}_db"
    target_pass="n\${i}_pass123"
    new_db_url="postgresql://\${target_db}:\${target_pass}@localhost:5432/\${target_db}?schema=public"
    
    echo "================================="
    echo "Node N$i Before:"
    grep DATABASE_URL "$env_file" || true
    grep PORT= "$env_file" || true
    
    # Patch the DATABASE_URL in place securely via awk or sed
    sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\\"$new_db_url\\"|g" "$env_file"
    
    if [ "$i" -eq 1 ]; then
        target_port="3001"
    elif [ "$i" -eq 10 ]; then
        target_port="3010"
    else
        target_port="300\${i}"
    fi
    sed -i "s|^PORT=.*|PORT=$target_port|g" "$env_file"
    
    echo "Node N$i AFTER:"
    grep DATABASE_URL "$env_file" || true
    grep PORT= "$env_file" || true
    
    if [ "$i" -eq 1 ]; then
        pm2 restart nama-main >> /dev/null
    elif [ "$i" -eq 7 ]; then
        pm2 restart n7 >> /dev/null
    else
        pm2 restart "n\${i}-main" >> /dev/null
    fi
    echo "Restarted N$i"
done
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
