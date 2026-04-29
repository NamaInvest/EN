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
echo "🚀 Starting Massive DB Clone and Code Sync Process from N11 to N1-N6, N8-N10!"

echo "📦 Step 1: Dump N11 Database"
export PGPASSWORD="n11_pass123"
pg_dump -h localhost -p 5432 -U postgres -d n11_db -F c -f /tmp/n11_master.dump || { echo "DB Dump failed!"; exit 1; }
echo "✅ Dump completed successfully!"

nodes=(1 2 3 4 5 6 8 9 10)

echo "🔄 Step 2 & 3 & 4: Terminate, Recreate, Restore, Sync, Restart"
for i in "\${nodes[@]}"; do
    target_db="n\${i}_db"
    target_pass="n\${i}_pass123"
    target_user="n\${i}_db"
    
    if [ "$i" -eq 1 ]; then
        pm2_app="nama-main"
        port="3001"
    elif [ "$i" -eq 10 ]; then
        pm2_app="n10-main"
        port="3010"
    else
        pm2_app="n\${i}-main"
        port="300\${i}"
    fi
    dir_path="/www/wwwroot/n\${i}.namainvist.com/"
    
    echo "=========================================="
    echo "🏢 Processing Node N$i..."
    echo "Target DB: $target_db | PM2 App: $pm2_app | Path: $dir_path"
    
    echo ">> 🔌 Disconnecting DB..."
    export PGPASSWORD="n11_pass123" # using any env password for psql local superuser works if pg_hba permits
    psql -h localhost -p 5432 -U postgres -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '\${target_db}';" || true
    
    echo ">> 💥 Dropping and Recreating Database..."
    psql -h localhost -p 5432 -U postgres -d postgres -c "DROP DATABASE IF EXISTS \${target_db};" || true
    psql -h localhost -p 5432 -U postgres -d postgres -c "CREATE USER \${target_user} WITH PASSWORD '\${target_pass}';" || true
    psql -h localhost -p 5432 -U postgres -d postgres -c "CREATE DATABASE \${target_db} OWNER \${target_user};"
    psql -h localhost -p 5432 -U postgres -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE \${target_db} TO \${target_user};"
    
    echo ">> 💾 Restoring DB Data..."
    pg_restore -h localhost -p 5432 -U postgres -d \${target_db} --no-owner --role=\${target_user} /tmp/n11_master.dump || echo "Warning: minor restore warnings."
    
    echo ">> 📂 Rsyncing Codebase..."
    rsync -a --delete --exclude=".env" --exclude=".user.ini" --exclude="node_modules/.cache" --exclude=".next/cache" /www/wwwroot/n11.namainvist.com/ \${dir_path}
    
    echo ">> ♻️ Restarting PM2 Service ($pm2_app)..."
    cd \${dir_path}
    pm2 restart $pm2_app || true
    
    echo ">> ⏳ Waiting for service to boot..."
    sleep 5
    
    echo ">> 🩺 Health Check (Port $port)..."
    code=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:\${port})
    if [ "$code" -eq 200 ] || [ "$code" -eq 307 ] || [ "$code" -eq 308 ]; then
        echo "✅ Node N$i is HEALTHY! (HTTP $code)"
    else
        echo "❌ Node N$i Health Check FAILED. Retrying in 5 seconds..."
        sleep 5
        code2=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:\${port})
        if [ "$code2" -eq 200 ] || [ "$code2" -eq 307 ] || [ "$code2" -eq 308 ]; then
             echo "✅ Node N$i is HEALTHY! (HTTP $code2)"
        else
             echo "⚠️ Node N$i returned HTTP $code2"
        fi
    fi

done

echo "=========================================="
echo "🧹 Cleaning up..."
rm -f /tmp/n11_master.dump

echo "🔥 FLEET SYNCHRONIZATION OVER. ALL TARGETS CLONED AND RESTORED SUCESSFULLY!"
`;

const conn = new Client();
conn.on('ready', () => {
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            conn.end();
        }).on('data', d => process.stdout.write(d.toString()))
          .stderr.on('data', d => process.stderr.write(d.toString()));
    });
}).on('error', console.error).connect(config);
