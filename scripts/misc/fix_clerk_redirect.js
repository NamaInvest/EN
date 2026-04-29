const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
echo "=== Update Clerk redirect URLs in main-site .env ==="

# Change /company-info to /dashboard for sign-in redirect
sed -i 's|NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=.*|NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard|' /www/wwwroot/namainvist.com/.env

# Keep /company-info for sign-up (new users should fill company info)
# sed -i 's|NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=.*|NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/company-info|' /www/wwwroot/namainvist.com/.env

echo "✅ Updated"
echo ""
echo "=== Verify changes ==="
grep -E "CLERK_SIGN_IN|CLERK_SIGN_UP" /www/wwwroot/namainvist.com/.env

echo ""
echo "=== Restart main-site with new env ==="
pm2 restart main-site --update-env && echo "✅ main-site restarted"
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
