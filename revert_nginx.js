const { Client } = require('ssh2');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    readyTimeout: 30000
};

const cmd = `
FILE=$(ls /www/server/panel/vhost/nginx/proxy/namainvist.com/*.conf | head -n 1)
sed -i 's/3001/2999/g' $FILE
/www/server/nginx/sbin/nginx -s reload
echo "Reverted Nginx namainvist.com proxy back to 2999"
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
