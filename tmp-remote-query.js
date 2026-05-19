const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    // Get the key from namafoundation and check if we should copy it or let user enter their own
    const cmd = `
        echo "=== Current gemini_api_key in settings ==="
        PGPASSWORD=RootPassNama123 psql -U postgres -h 127.0.0.1 -d n11_db -c "SELECT key, left(value,40) as value_preview, tenant_id FROM settings WHERE key = 'gemini_api_key';"
        echo ""
        echo "=== Checking if ahmedalyamicompany has gemini key ==="
        PGPASSWORD=RootPassNama123 psql -U postgres -h 127.0.0.1 -d n11_db -c "SELECT COUNT(*) FROM settings WHERE key='gemini_api_key' AND tenant_id='ahmedalyamicompany';"
    `;
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
});
