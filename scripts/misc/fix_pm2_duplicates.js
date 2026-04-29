const { Client } = require('ssh2');

// Delete all duplicate "tenant-nX" processes - the real ones are "nX-main"
const bashCommand = `
echo "=== Removing duplicate tenant-nX processes that conflict with nX-main ==="

for n in n2 n3 n4 n5 n6 n8 n9 n10; do
    echo "Deleting tenant-$n..."
    pm2 delete tenant-$n || true
done

echo ""
echo "=== Also removing errored processes: 11, nama-main (old duplicate) ==="
pm2 delete 11 || true

echo ""
echo "=== Checking tenants that DO need to stay (tenant-n1 is correct because it uses n1's dir) ==="
pm2 show tenant-n1 2>&1 | grep -E "status|script path|port"

echo ""
echo "=== Final PM2 List ==="
pm2 ls

pm2 save
echo "Done!"
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
