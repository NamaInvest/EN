const { Client } = require('ssh2');

const bashCommand = `
echo "=== Last 3 Provision Logs ==="
ls -lt /tmp/provision_*.log | head -n 3

echo -e "\n=== Content of the absolute latest provision log ==="
LATEST_LOG=$(ls -t /tmp/provision_*.log | head -n 1)
if [ -n "$LATEST_LOG" ]; then
    echo "Reading $LATEST_LOG..."
    tail -n 60 "$LATEST_LOG"
else
    echo "No provision logs found."
fi
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
