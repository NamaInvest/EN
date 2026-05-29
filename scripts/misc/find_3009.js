const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
        # Find what process is on port 3009
        PID=$(ss -tlnp 2>/dev/null | grep ':3009' | grep -oP 'pid=\\K[0-9]+' | head -1)
        echo "PID on 3009: $PID"
        if [ -n "$PID" ]; then
            echo "CWD: $(readlink /proc/$PID/cwd 2>/dev/null)"
            echo "CMD: $(cat /proc/$PID/cmdline 2>/dev/null | tr '\\0' ' ')"
        fi
        
        # Also find all PM2 processes with their ports
        echo ""
        echo "=== ALL PM2 PROCS WITH ARGS ==="
        pm2 jlist 2>/dev/null | python3 -c "
import sys, json
procs = json.load(sys.stdin)
for p in procs:
    print(p.get('name','?'), '|', p.get('pm2_env',{}).get('pm_cwd','?'), '|', p.get('pm2_env',{}).get('args',[]))
" 2>/dev/null || pm2 list
        
        # Find nginx config
        echo ""
        echo "=== NGINX VHOST DIR ==="
        find /etc/nginx /usr/local/nginx /www/server -name "*n2*" 2>/dev/null | head -5
        
        # Find from aaPanel
        echo ""
        echo "=== AAPANEL NGINX ==="
        ls /www/server/panel/vhost/nginx/ 2>/dev/null | grep n2
    `, (err, stream) => {
        let data = '';
        stream.on('data', d => data += d);
        stream.stderr.on('data', d => data += d);
        stream.on('close', () => {
            console.log(data);
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
