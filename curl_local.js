const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    // We curl the Next.js server directly.
    const script = `
        echo "=== CURL NEXT.JS ==="
        curl -s http://localhost:2999 | grep "القائمة الرئيسية" && echo "NEW_UI_FOUND_IN_NODE" || echo "OLD_UI_STILL_IN_NODE"
    `;
    conn.exec(script, (err, stream) => {
        if (err) throw err;
        stream.pipe(process.stdout);
        stream.stderr.pipe(process.stderr);
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
