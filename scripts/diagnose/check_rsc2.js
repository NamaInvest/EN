const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    // Check what HTML the server actually returns for a logged-in session
    // First, try to get a valid token
    conn.exec(`
        # Get the auth page's HTML to check if sidebar is server-rendered
        curl -sk "https://n2.namainvist.com/accounting" 2>/dev/null | grep -oE "(طلبات الشراء|purchase)[^\"<]{0,50}" | head -5
        echo "---"
        # Check the RSC (React Server Component) payload file for sidebar
        ls /www/wwwroot/n2.namainvist.com/.next/server/app/ | head -20
        echo "---"
        # Check ONE of the pre-rendered pages
        cat /www/wwwroot/n2.namainvist.com/.next/server/app/loyalty.html 2>/dev/null | grep -oE "[أ-ي]{3,}" | sort -u | head -20
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
