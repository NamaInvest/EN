const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    // Run comprehensive test on the actual running N3 server
    const cmd = `cd /www/wwwroot/n3.namainvist.com

# Test 1: Does the translations.ts file exist and have content?
echo "=== translations.ts ==="
wc -l src/lib/translations.ts 2>/dev/null
head -6 src/lib/translations.ts 2>/dev/null

# Test 2: Does the new i18n.tsx exist?
echo ""
echo "=== i18n.tsx ==="
wc -l src/lib/i18n.tsx
head -5 src/lib/i18n.tsx
grep "from './translations'" src/lib/i18n.tsx

# Test 3: Does the built output have the translate function?  
echo ""
echo "=== Built chunks analysis ==="
MAIN_CHUNK=$(grep -rl "translate" .next/static/chunks/ 2>/dev/null | head -1)
echo "Chunk with translate: $MAIN_CHUNK"
echo "Chunk size: $(wc -c < $MAIN_CHUNK 2>/dev/null) bytes"

# Test 4: Critical - is the translations data in any built chunk?
echo ""
echo "=== Arabic translation text in chunks ==="
echo -n "Chunks with لوحة التحكم: "
grep -rl "لوحة التحكم" .next/static/chunks/ 2>/dev/null | wc -l
echo -n "Chunks with dashboard.title: "
grep -rl "dashboard.title" .next/static/chunks/ 2>/dev/null | wc -l

# Test 5: Check the SSR rendered HTML - THIS IS THE KEY TEST
echo ""
echo "=== SSR HTML test ==="
curl -s http://localhost:3003/dashboard -H "Cookie: next-auth.session-token=test" 2>/dev/null | grep -o 'dashboard\\.title\\|لوحة التحكم\\|common\\.sar' | sort | uniq -c || echo "curl failed"

# Test 6: Try a simpler curl to see what HTML the server returns
echo ""
echo "=== Raw HTML snippet ==="
curl -s http://localhost:3003/dashboard 2>/dev/null | head -c 2000 | grep -o '"[^"]*dashboard[^"]*"' | head -5 || echo "no dashboard strings found"

# Test 7: Check if there's an error in the server logs
echo ""  
echo "=== Recent N3 errors ==="
pm2 logs n3 --nostream --lines 5 --err --no-color 2>/dev/null
`;

    conn.exec(cmd, (err, stream) => {
        if (err) { console.error(err); conn.end(); return; }
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.stderr.on('data', d => {});
        stream.on('close', () => { console.log(out); conn.end(); });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 15000 });
