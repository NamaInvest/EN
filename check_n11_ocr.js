const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    // Get recent N11 error logs + check OCR API route
    const cmd = `
echo "=== N11 PM2 ERROR LOGS (last 50 lines) ==="
pm2 logs n11 --lines 50 --nostream --err 2>/dev/null

echo ""
echo "=== N11 ALL LOGS (last 30 lines) ==="
pm2 logs n11 --lines 30 --nostream 2>/dev/null

echo ""
echo "=== GEMINI KEY IN N11 ENV ==="
cat /www/wwwroot/n11.namainvist.com/.env | grep -i "GEMINI\\|OCR\\|AI\\|VISION\\|GOOGLE"

echo ""
echo "=== OCR ROUTE EXISTS ==="
ls /www/wwwroot/n11.namainvist.com/src/app/api/ocr* 2>/dev/null || echo "No OCR route found"
ls /www/wwwroot/n11.namainvist.com/src/app/api/purchases/scan* 2>/dev/null || echo "No scan route"
find /www/wwwroot/n11.namainvist.com/src -name "*ocr*" -o -name "*scan*" -o -name "*vision*" 2>/dev/null | head -10
`;

    conn.exec(cmd, (err, stream) => {
        if (err) { conn.end(); return; }
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => conn.end());
    });
}).connect({
    host: '46.4.188.170', port: 22,
    username: 'root', password: '_ee4SWbxLVfH9b'
});
