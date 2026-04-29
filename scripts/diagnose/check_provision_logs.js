const { Client } = require('ssh2');

// Check the latest provision log AND list any new directories
const bashCommand = `
echo "=== Latest Provision Logs ==="
ls -t /tmp/provision_*.log 2>/dev/null | head -5
echo "---"
LATEST=$(ls -t /tmp/provision_*.log 2>/dev/null | head -1)
if [ -n "$LATEST" ]; then
    echo "Reading: $LATEST"
    tail -80 "$LATEST"
fi
echo "=== New directories in /www/wwwroot ==="
ls -la /www/wwwroot/ | grep -v "n1\|n2\|n3\|n4\|n5\|n6\|n7\|n8\|n9\|n10\|n11\|namainvist"
`;

const conn = new Client();
conn.on('ready', () => {
    conn.exec(bashCommand, (err, stream) => {
        if (err) throw err;
        stream.on('data', (d) => process.stdout.write(d));
        stream.stderr.on('data', (d) => process.stdout.write(d));
        stream.on('close', () => conn.end());
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
});
