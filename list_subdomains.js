const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
echo "=== Nginx subdomains (namainvist.com) ==="
grep -r "server_name" /etc/nginx/sites-enabled/ 2>/dev/null | grep namainvist | sed 's/.*server_name//' | tr -d ';' | tr ' ' '\\n' | grep -v '^$' | sort -u

echo ""
echo "=== All nginx configs ==="
ls /etc/nginx/sites-enabled/ 2>/dev/null

echo ""
echo "=== Subdomains from nginx vhosts ==="
grep -rh "server_name" /etc/nginx/conf.d/ 2>/dev/null | sed 's/.*server_name//' | tr -d ';' | tr ' ' '\\n' | grep namainvist | grep -v '^$' | sort -u

echo ""
echo "=== BT Panel sites/vhosts ==="
ls /www/server/panel/vhost/nginx/ 2>/dev/null | grep namainvist | head -20
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
