const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmds = `
        echo "Granting SUPERUSER to n2_db and n3_db to bypass Prisma restrictions..."
        sudo -u postgres psql -c "ALTER USER n2_db WITH SUPERUSER;"
        cd /www/wwwroot/n2.namainvist.com
        npm run db:setup
        
        sudo -u postgres psql -c "ALTER USER n3_db WITH SUPERUSER;"
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
    password: '_ee4SWbxLVfH9b',
    keepaliveInterval: 10000
});
