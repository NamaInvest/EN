const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmd = `
        echo "Check Certificate Subject:"
        openssl x509 -in /www/server/panel/vhost/cert/namainvist.com/fullchain.pem -text -noout | grep -E "Subject:|DNS:"
        echo ""
        echo "Check NGINX Conf:"
        cat /www/server/panel/vhost/nginx/namainvist.com.conf
    `;
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
              .on('data', data => console.log(data.toString()))
              .stderr.on('data', data => console.error(data.toString()));
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
