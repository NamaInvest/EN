const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    // Find what imports Sidebar in layout files
    conn.exec(`
        grep -rn "Sidebar\|sidebar" /www/wwwroot/n2.namainvist.com/src/app/ --include="*.tsx" --include="*.ts" | grep -v "node_modules" | grep "import" | head -10
        echo "=== COMPONENTS DIR ==="
        ls /www/wwwroot/n2.namainvist.com/src/components/ | grep -i "side\|layout\|nav"
        echo "=== WHAT IS IN 50eeb4eb CHUNK ==="
        grep -oE '"(s\\.dashboard|sectionKey|labelKey|Dashboard.*Sidebar)[^"]{0,100}' /www/wwwroot/n2.namainvist.com/.next/server/chunks/ssr/src_components_50eeb4eb._.js 2>/dev/null | head -10
        echo "=== WHAT IS IN 971670f5 CHUNK ==="
        grep -oE '"(s\\.dashboard|sectionKey|labelKey)[^"]{0,50}' /www/wwwroot/n2.namainvist.com/.next/server/chunks/ssr/src_components_971670f5._.js 2>/dev/null | head -10
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
