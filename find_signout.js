const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
echo "=== Search for signOut / UserButton in saas-app ==="
grep -r "signOut\\|UserButton\\|afterSignOut\\|/login\\|SIGN_OUT" /www/wwwroot/n11.namainvist.com/src --include="*.tsx" --include="*.ts" -l 2>/dev/null | head -10

echo ""
echo "=== Files with signOut ==="
grep -rn "signOut\\|UserButton\\|afterSignOut" /www/wwwroot/n11.namainvist.com/src --include="*.tsx" --include="*.ts" 2>/dev/null | head -20

echo ""
echo "=== Check Clerk AFTER_SIGN_OUT env in both sites ==="
grep -i "sign_out\\|after_sign_out" /www/wwwroot/namainvist.com/.env 2>/dev/null
grep -i "sign_out\\|after_sign_out" /www/wwwroot/n11.namainvist.com/.env 2>/dev/null

echo ""
echo "=== login page exists in saas-app? ==="
find /www/wwwroot/n11.namainvist.com/src -name "*.tsx" -path "*/login*" 2>/dev/null | head -5
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
