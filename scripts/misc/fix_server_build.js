const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
echo "=== Moving (dashboard)/company-info to settings/company on server ==="
SAAS="/www/wwwroot/n11.namainvist.com/src/app"

# Create new directory
mkdir -p "$SAAS/(dashboard)/settings/company"

# Move the file
if [ -f "$SAAS/(dashboard)/company-info/page.tsx" ]; then
    mv "$SAAS/(dashboard)/company-info/page.tsx" "$SAAS/(dashboard)/settings/company/page.tsx"
    echo "✅ Moved company-info/page.tsx to settings/company/page.tsx"
else
    echo "File not found at (dashboard)/company-info/page.tsx — already moved or doesn't exist"
fi

# Remove empty directory
rmdir "$SAAS/(dashboard)/company-info" 2>/dev/null && echo "✅ Removed empty company-info dir" || echo "Dir not empty or already removed"

# Verify
echo "--- Checking (dashboard)/company-info: ---"
ls "$SAAS/(dashboard)/company-info/" 2>/dev/null || echo "GONE ✅"

echo "--- Checking (dashboard)/settings/company: ---"
ls "$SAAS/(dashboard)/settings/company/" 2>/dev/null

echo ""
echo "--- Fix email route: remove static import ---"
# Change static import of email to avoid build error
sed -i 's/^import { sendEmail, welcomeEmailTemplate, passwordResetTemplate } from .@\/lib\/email.;/\/\/ Email import removed - use dynamic import below/' \
    /www/wwwroot/n11.namainvist.com/src/app/api/email/route.ts && echo "✅ Email import patched"

echo "--- First few lines of email route after patch ---"
head -10 /www/wwwroot/n11.namainvist.com/src/app/api/email/route.ts
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
