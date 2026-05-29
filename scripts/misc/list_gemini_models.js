const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    const cmd = `
API_KEY=$(cd /www/wwwroot/n11.namainvist.com && node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.setting.findUnique({ where: { key: 'gemini_api_key' } }).then(r => { 
    process.stdout.write(r?.value?.trim() || '');
    p.\\$disconnect();
});
" 2>/dev/null)

echo "=== Available models for this key ==="
curl -s "https://generativelanguage.googleapis.com/v1beta/models?key=\$API_KEY" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for m in data.get('models', []):
    if 'generateContent' in m.get('supportedGenerationMethods', []):
        print(m['name'])
" 2>/dev/null || echo "Python failed, raw:"

echo ""
echo "=== Test gemini-pro ==="
curl -s -o /dev/null -w "%{http_code}" "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=\$API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"contents":[{"parts":[{"text":"hi"}]}]}'

echo ""
echo "=== Test gemini-1.0-pro ==="  
curl -s -o /dev/null -w "%{http_code}" "https://generativelanguage.googleapis.com/v1/models/gemini-1.0-pro:generateContent?key=\$API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"contents":[{"parts":[{"text":"hi"}]}]}'
`;

    conn.exec(cmd, (err, stream) => {
        if (err) { conn.end(); return; }
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => conn.end());
    });
}).connect({
    host: '46.4.188.170', port: 22,
    username: 'root', password: 'process.env.SSH_PASSWORD'
});
