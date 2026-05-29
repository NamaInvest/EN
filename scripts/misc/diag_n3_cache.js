const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    // Check if browser is getting old cached JS
    const cmds = [
        'cd /www/wwwroot/n3.namainvist.com',
        // Check chunk file timestamps
        'echo "=== Chunk file that has translations ==="',
        'ls -la .next/static/chunks/fd76c177f71ae8d2.js',
        'echo ""',
        // Check if there are old _next/static files being served
        'echo "=== BUILD_ID ==="',
        'cat .next/BUILD_ID',
        'echo ""',
        // Check if there's a _next symlink or cache
        'echo "=== public/_next check ==="',
        'ls -la public/_next 2>/dev/null || echo "no public/_next"',
        'echo ""',
        // Check PM2 env 
        'echo "=== PM2 N3 process info ==="',
        'pm2 show n3 --no-color 2>/dev/null | grep -E "status|uptime|restart|script|cwd" | head -10',
        'echo ""',
        // Check if there is a CDN or reverse proxy caching
        'echo "=== Nginx config for N3 ==="',
        'cat /www/server/panel/vhost/nginx/n3.namainvist.com.conf 2>/dev/null | grep -E "proxy_cache|cache|expires|add_header" | head -10',
    ].join(' && ');

    conn.exec(cmds, (err, stream) => {
        if (err) { console.error(err); conn.end(); return; }
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.stderr.on('data', d => {});
        stream.on('close', () => { console.log(out); conn.end(); });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 15000 });
