const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected! Checking i18n.tsx on all nodes...\n');
    
    const cmd = `
for i in 1 2 3 4 5 6 7 8 9 10; do
    FILE="/www/wwwroot/n\${i}.namainvist.com/src/lib/i18n.tsx"
    if [ -f "$FILE" ]; then
        LINES=$(wc -l < "$FILE")
        SIZE=$(stat -c%s "$FILE" 2>/dev/null || echo "?")
        echo "N$i: $LINES lines, $SIZE bytes"
    else
        echo "N$i: FILE MISSING!"
    fi
done

echo ""
echo "=== PM2 Status ==="
pm2 list --no-color 2>/dev/null | head -40

echo ""
echo "=== Build timestamps ==="
for i in 1 2 3 4 5 6 7 8 9 10; do
    NEXT_DIR="/www/wwwroot/n\${i}.namainvist.com/.next"
    if [ -d "$NEXT_DIR" ]; then
        STAMP=$(stat -c%Y "$NEXT_DIR/BUILD_ID" 2>/dev/null || echo "no_build_id")
        if [ "$STAMP" != "no_build_id" ]; then
            DATE=$(date -d @$STAMP "+%Y-%m-%d %H:%M")
            echo "N$i build: $DATE"
        else
            echo "N$i: .next exists but no BUILD_ID"
        fi
    else
        echo "N$i: NO .next directory!"
    fi
done
`;
    
    conn.exec(cmd, (err, stream) => {
        if (err) { console.error(err); conn.end(); return; }
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => conn.end());
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    readyTimeout: 15000
});
