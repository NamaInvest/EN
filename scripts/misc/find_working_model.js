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

echo "Testing models one by one..."

for MODEL in "gemini-2.5-flash" "gemini-2.0-flash-001" "gemini-2.0-flash-lite-001" "gemini-flash-latest" "gemini-pro-latest"; do
  STATUS=$(curl -s -o /tmp/t.json -w "%{http_code}" \\
    "https://generativelanguage.googleapis.com/v1beta/models/\${MODEL}:generateContent?key=\$API_KEY" \\
    -H "Content-Type: application/json" \\
    -d '{"contents":[{"parts":[{"text":"reply with the word OK only"}]}]}')
  RESP=$(cat /tmp/t.json | head -c 200)
  echo "[\$STATUS] \$MODEL => \$RESP"
  echo "---"
done
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
