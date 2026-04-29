const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
echo "=== /login page content ==="
cat /www/wwwroot/n11.namainvist.com/src/app/login/page.tsx 2>/dev/null | head -40

echo ""
echo "=== Sidebar sign-out button ==="
grep -n "logout\\|sign.out\\|خروج\\|/login" /www/wwwroot/n11.namainvist.com/src/components/Sidebar.tsx 2>/dev/null | head -15

echo ""
echo "=== master-panel layout signOut ==="
grep -n "signOut\\|UserButton\\|afterSignOut" /www/wwwroot/n11.namainvist.com/src/app/master-panel/layout.tsx 2>/dev/null | head -10
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
