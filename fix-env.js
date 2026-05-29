const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    const cmd = `
        sed -i 's/DESKTOP_MODE=true/DESKTOP_MODE=false/g' /www/wwwroot/namainvist.com/.env &&
        sed -i 's/postgres:root@localhost:5432\\/namasoft/postgres:RootPassNama123@localhost:5432\\/n11_db/g' /www/wwwroot/namainvist.com/.env &&
        pm2 restart all --update-env
    `;
    console.log("Executing fix command...");
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        let data = '';
        stream.on('data', (d) => { data += d.toString(); });
        stream.stderr.on('data', (d) => { data += d.toString(); });
        stream.on('close', () => {
            console.log("Result:");
            console.log(data);
            conn.end();
        });
    });
}).on('error', (err) => {
    console.error(err);
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: 'process.env.SSH_PASSWORD',
    readyTimeout: 10000
});
