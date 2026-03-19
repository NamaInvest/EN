const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmds = `
        echo "Stopping PM2 for n2 and n3 to release database connections..."
        pm2 stop n2 n3 || true
        
        echo "Force disconnecting clients from n2_db and n3_db..."
        sudo -u postgres psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname IN ('n2_db', 'n3_db');" || true

        echo "Recreating n2_db..."
        sudo -u postgres psql -c "DROP DATABASE IF EXISTS n2_db;"
        sudo -u postgres psql -c "DROP ROLE IF EXISTS n2_db;"
        sudo -u postgres psql -c "CREATE USER n2_db WITH PASSWORD 'n2_pass123';"
        sudo -u postgres psql -c "CREATE DATABASE n2_db OWNER n2_db;"
        sudo -u postgres psql -d n2_db -c "ALTER SCHEMA public OWNER TO n2_db;"
        
        echo "Running db:setup for n2..."
        cd /www/wwwroot/n2.namainvist.com
        npm run db:setup
        
        echo "Recreating n3_db..."
        sudo -u postgres psql -c "DROP DATABASE IF EXISTS n3_db;"
        sudo -u postgres psql -c "DROP ROLE IF EXISTS n3_db;"
        sudo -u postgres psql -c "CREATE USER n3_db WITH PASSWORD 'n3_pass123';"
        sudo -u postgres psql -c "CREATE DATABASE n3_db OWNER n3_db;"
        sudo -u postgres psql -d n3_db -c "ALTER SCHEMA public OWNER TO n3_db;"
        
        echo "Running db:setup for n3..."
        cd /www/wwwroot/n3.namainvist.com
        npm run db:setup
        
        echo "Restarting PM2..."
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
    password: '_ee4SWbxLVfH9b',
    keepaliveInterval: 10000
});
