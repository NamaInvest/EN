const { Client } = require('ssh2');

const bashCommand = `
echo "=== What is using port 3012? ==="
lsof -i :3012 || ss -tlnp | grep 3012

echo ""
echo "=== Check all .env files to see which ports are actually used ==="
grep -h "^PORT=" /www/wwwroot/*/. env 2>/dev/null || for d in /www/wwwroot/*/; do 
    if [ -f "$d/.env" ]; then
        PORT=$(grep "^PORT=" "$d/.env" | cut -d'=' -f2)
        echo "$d -> PORT=$PORT"
    fi
done

echo ""
echo "=== List all listening ports ==="
ss -tlnp | grep -E "3[0-9]{3}[0-9]"
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
