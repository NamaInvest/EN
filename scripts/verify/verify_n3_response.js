const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmd = `
echo "=== Testing localhost:3003/login ==="
HTML=$(curl -s http://localhost:3003/login)
echo "Contains sys.str_13 (Login):"
echo "$HTML" | grep -o 'sys.str_13' || echo "No sys.str_13"
echo "Contains تسجيل الدخول (Login in Arabic):"
echo "$HTML" | grep -o 'تسجيل الدخول' || echo "No Arabic login text"
echo "Contains sys.str_ (Any raw keys):"
echo "$HTML" | grep -o 'sys.str_[0-9]*' | head -5 || echo "No raw keys"

echo "=== Testing chunks ==="
echo "$HTML" | grep -o '/_next/static/chunks/[^"]*.js' | head -3
`;

    conn.exec(cmd, (err, stream) => {
        if (err) { console.error(err); conn.end(); return; }
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => { console.log(out); conn.end(); });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 15000 });
