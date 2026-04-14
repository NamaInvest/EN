const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    const cmd = `
echo "=== OCR route model name on N11 ==="
grep "gemini" /www/wwwroot/n11.namainvist.com/src/app/api/purchases/ocr/route.ts

echo ""
echo "=== N11 recent error logs ==="
pm2 logs n11 --lines 30 --nostream --err 2>/dev/null | grep -E "OCR|Error|gemini|model|404|fetch" | tail -20

echo ""
echo "=== Test the key directly ==="
API_KEY=$(cd /www/wwwroot/n11.namainvist.com && node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.setting.findUnique({ where: { key: 'gemini_api_key' } }).then(r => { 
    process.stdout.write(r?.value?.trim() || '');
    p.\\$disconnect();
});
" 2>/dev/null)
echo "Key prefix: \${API_KEY:0:20}..."

# Test with gemini-1.5-flash
RESULT=$(curl -s -o /tmp/gemini_test.json -w "%{http_code}" \\
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=\$API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"contents":[{"parts":[{"text":"say hi"}]}]}')
echo "HTTP Status for gemini-1.5-flash: \$RESULT"
cat /tmp/gemini_test.json | head -c 500

echo ""
echo "=== Test gemini-2.0-flash-lite ==="
RESULT2=$(curl -s -o /tmp/gemini_test2.json -w "%{http_code}" \\
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=\$API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"contents":[{"parts":[{"text":"say hi"}]}]}')
echo "HTTP Status for gemini-2.0-flash-lite: \$RESULT2"
cat /tmp/gemini_test2.json | head -c 300
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
