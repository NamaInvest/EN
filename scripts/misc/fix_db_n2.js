const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmds = `
        echo "Fixing n2_db permissions..."
        sudo -u postgres psql -d n2_db -c "ALTER SCHEMA public OWNER TO n2_db;"
        cd /www/wwwroot/n2.namainvist.com
        npm run db:setup
        
        echo "Fixing n3_db permissions..."
        sudo -u postgres psql -d n3_db -c "ALTER SCHEMA public OWNER TO n3_db;"
        cd /www/wwwroot/n3.namainvist.com
        npm run db:setup
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
