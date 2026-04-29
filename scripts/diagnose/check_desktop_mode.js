const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  conn.exec(`
    cd /www/wwwroot/namainvist.com;
    echo "=== DESKTOP_MODE in .env ===";
    grep DESKTOP_MODE .env 2>/dev/null || echo "DESKTOP_MODE NOT SET in .env";
    echo "=== Check compiled layout for isDesktopMode ===";
    find .next/server -name "layout*" 2>/dev/null | head -5;
    echo "=== Check with node: is DESKTOP_MODE set? ===";
    node -e "console.log('DESKTOP_MODE:', process.env.DESKTOP_MODE || 'UNDEFINED')";
    echo "=== Look at sign-in build output ===";
    ls -la .next/server/app/sign-in/ 2>/dev/null;
    echo "=== Check compiled layout for require clerk ===";
    cat .next/server/app/layout.js 2>/dev/null | head -30 || echo "No layout.js";
    cat .next/server/app/page_client-reference-manifest.js 2>/dev/null | head -5 || echo "no manifest";
    echo "=== Check .env for DESKTOP_MODE ===";
    cat .env | head -5;
  `, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    let out = '';
    stream.on('data', d => out += d.toString());
    stream.stderr.on('data', d => out += d.toString());
    stream.on('close', () => { console.log(out); conn.end(); });
  });
});
conn.on('error', (err) => console.error('SSH err:', err.message));
conn.connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
