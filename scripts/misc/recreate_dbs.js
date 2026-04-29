const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmds = `
        echo "Recreating n2_db..."
        sudo -u postgres psql -c "DROP DATABASE IF EXISTS n2_db;"
        sudo -u postgres psql -c "DROP ROLE IF EXISTS n2_db;"
        sudo -u postgres psql -c "CREATE USER n2_db WITH PASSWORD 'n2_pass123';"
        sudo -u postgres psql -c "CREATE DATABASE n2_db OWNER n2_db;"
        sudo -u postgres psql -d n2_db -c "ALTER SCHEMA public OWNER TO n2_db;"
        
        cd /www/wwwroot/n2.namainvist.com
        npm run db:setup
        
        echo "Recreating n3_db..."
        sudo -u postgres psql -c "DROP DATABASE IF EXISTS n3_db;"
        sudo -u postgres psql -c "DROP ROLE IF EXISTS n3_db;"
        sudo -u postgres psql -c "CREATE USER n3_db WITH PASSWORD 'n3_pass123';"
        sudo -u postgres psql -c "CREATE DATABASE n3_db OWNER n3_db;"
        sudo -u postgres psql -d n3_db -c "ALTER SCHEMA public OWNER TO n3_db;"
        
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
    password: '_ee4SWbxLVfH9b',
    keepaliveInterval: 10000
});
