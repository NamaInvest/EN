const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const testCmd = `
cd /www/wwwroot/n3.namainvist.com

# Find the main i18n chunk and check what keys are there
CHUNK=$(grep -rl "sys.str_549" .next/static/chunks/ | head -1)
echo "Chunk: $CHUNK"
echo "Size: $(wc -c < $CHUNK) bytes"

# Check if dashboard.title AS KEY is in this chunk (quoted as a property)
echo ""
echo "=== Key presence in built chunk ==="
echo -n "dashboard.title: "; grep -c "dashboard.title" "$CHUNK"
echo -n "dashboard.refresh: "; grep -c "dashboard.refresh" "$CHUNK"
echo -n "common.sar: "; grep -c "common.sar" "$CHUNK"
echo -n "لوحة التحكم: "; grep -c "لوحة التحكم" "$CHUNK"
echo -n "تحديث: "; grep -c "تحديث" "$CHUNK"
echo -n "ر.س: "; grep -c "ر.س" "$CHUNK"

# Extract a small portion around dashboard.title in the chunk
echo ""
echo "=== Context around dashboard.title in chunk ==="
grep -oP '.{0,80}dashboard\.title.{0,80}' "$CHUNK" | head -3

echo ""
echo "=== Context around common.sar in chunk ==="
grep -oP '.{0,60}common\.sar.{0,60}' "$CHUNK" | head -3

echo ""
echo "=== How many total ar keys in chunk? ==="
# Count occurrences of 'ar' object keys
grep -oP '"[a-z]+\.[a-z_]+":' "$CHUNK" | wc -l

echo ""
echo "=== Check if there are TWO translations objects (split) ==="
grep -c "translations" "$CHUNK"

echo ""
echo "=== Check chunk for the t function ==="
grep -oP '.{0,50}translations\[.{0,100}' "$CHUNK" | head -5
`;

    conn.exec(testCmd, (err, stream) => {
        if (err) { console.error(err); conn.end(); return; }
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.stderr.on('data', d => out += d.toString());
        stream.on('close', () => { console.log(out); conn.end(); });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
