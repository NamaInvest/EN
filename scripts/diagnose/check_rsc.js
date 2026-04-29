const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    // Get the actual pre-rendered HTML content of the dashboard
    conn.exec(`
        # Check what's in the pre-rendered dashboard HTML
        find /www/wwwroot/n2.namainvist.com/.next -name "*.html" 2>/dev/null | head -5
        echo "---"
        # Check the static HTML content (if exists)
        find /www/wwwroot/n2.namainvist.com/.next/server/app -name "page.html" 2>/dev/null | xargs grep -l "sidebar\|Sidebar\|المشتريات" 2>/dev/null | head -3
        echo "---SIDEBAR RSC---"
        # Find RSC payload with sidebar content
        find /www/wwwroot/n2.namainvist.com/.next/server/app -name "*.rsc" 2>/dev/null | xargs grep -l "المشتريات" 2>/dev/null | head -3
        echo "---CHECK AAANEL---"
        # Check aaPanel nginx vhost
        cat /www/server/panel/vhost/nginx/n2.namainvist.com.conf 2>/dev/null | head -30
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
