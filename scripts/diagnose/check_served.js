const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
        # Get the actual HTML being served by N2 (port 3002) 
        # Look for sidebar-related content in the page HTML
        curl -s -H "Cookie: token=test" http://localhost:3002/dashboard 2>/dev/null | grep -oE "طلبات الشراء[^<\"]{0,30}" | head -5
        echo "---SEPARATOR---"
        # Also check the prerendered HTML file in .next
        find /www/wwwroot/n2.namainvist.com/.next/server/app -name "*.html" 2>/dev/null | head -3
        echo "---"
        # Check JS chunk that contains sidebar code
        grep -l "s\.dashboard\|s\.purchases\|gl(" /www/wwwroot/n2.namainvist.com/.next/static/chunks/*.js 2>/dev/null | head -3
        echo "---CHUNK-CONTENT---"
        # Get content of the sidebar JS chunk
        CHUNK=$(grep -rl "s\.dashboard" /www/wwwroot/n2.namainvist.com/.next/static/chunks/*.js 2>/dev/null | head -1)
        if [ -n "$CHUNK" ]; then
            grep -oE '"s\.(dashboard|sales|purchases)"[^,]{0,50}' "$CHUNK" | head -10
        fi
    `, (err, stream) => {
        let data = '';
        stream.on('data', d => data += d);
        stream.stderr.on('data', d => data += d);
        stream.on('close', () => {
            console.log(data);
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
