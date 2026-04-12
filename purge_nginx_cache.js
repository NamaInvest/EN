const { Client } = require('ssh2');
const config = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 60000 };

const conn = new Client();
conn.on('ready', () => {
    // Find nginx cache dirs and purge them + check proxy config
    conn.exec(`
find /www/server/nginx/proxy_cache_dir/ -type f -delete 2>/dev/null
find /tmp/nginx_cache/ -type f -delete 2>/dev/null  
find /var/cache/nginx/ -type f -delete 2>/dev/null
echo "Cache purge attempted"
cat /www/server/panel/vhost/nginx/namainvist.com.conf | grep -i cache | head -10
nginx -s reload
echo "NGINX reloaded"
`, (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.on('close', () => {
            console.log('Purge result:');
            console.log(out);
            conn.end();
        });
    });
}).on('error', console.error).connect(config);
