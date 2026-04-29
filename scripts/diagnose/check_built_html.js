const { Client } = require('ssh2');

const LANDING = '/www/wwwroot/namainvist.com';

const conn = new Client();
conn.on('ready', () => {
    // Check the ACTUAL built HTML that is being served
    conn.exec(`
echo "=== Checking built HTML output ==="
grep -c "اسم المنشأة بالإنجليزية" "${LANDING}/.next/server/app/onboarding/provisioning/page.html" 2>/dev/null && echo "OLD HTML in build!" || echo "No old EN field in built HTML - OK"

echo ""
echo "=== Check source file ==="
grep -c "اسم المنشأة بالإنجليزية" "${LANDING}/src/app/onboarding/provisioning/page.tsx" && echo "OLD SOURCE FILE!" || echo "Source file is new - OK"

echo ""
echo "=== Check build manifest - is onboarding dynamic or static? ==="
grep "onboarding" "${LANDING}/.next/server/app-paths-manifest.json" 2>/dev/null || echo "Not in manifest"

echo ""
echo "=== List files in onboarding build dir ==="
ls -la "${LANDING}/.next/server/app/onboarding/provisioning/" 2>/dev/null || echo "No static dir"

echo ""
echo "=== ACTUAL HTML SNIPPET (first 100 chars of body) ==="
grep -o "اسم المنشأة.*" "${LANDING}/.next/server/app/onboarding/provisioning/page.html" 2>/dev/null | head -5 || echo "File not found or no match"
`, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stdout.write(d));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
