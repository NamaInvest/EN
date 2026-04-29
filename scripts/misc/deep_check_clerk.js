const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  conn.exec(`
    # Check what DESKTOP_MODE is in the actual runtime
    cd /www/wwwroot/namainvist.com;
    echo "=== DESKTOP_MODE in .env ===";
    grep DESKTOP_MODE .env || echo "NOT SET in .env";
    grep DESKTOP_MODE .env.local 2>/dev/null || echo "NOT SET in .env.local";
    
    echo "=== Check if layout uses DESKTOP_MODE correctly ===";
    # The isDesktopMode check
    grep -n "isDesktopMode\|DESKTOP_MODE" src/app/layout.tsx;
    
    echo "=== Check built layout chunk for ClerkProvider ===";
    # Search in compiled chunks for ClerkProvider
    grep -r "ClerkProvider" .next/server/app/sign-in/ 2>/dev/null | head -5 || echo "No ClerkProvider in sign-in chunks";
    grep -r "ClerkProvider" .next/server/chunks/ 2>/dev/null | head -5 || echo "Checking server chunks...";
    
    echo "=== Check if there are two HTML elements (hydration mismatch) ===";
    curl -s http://localhost:3000/sign-in 2>/dev/null | grep -o "<html" | wc -l;
    
    echo "=== Check if ClerkLoaded and GlobalAuthGuard are in compiled output ===";
    grep -r "useSession" .next/server/ 2>/dev/null | head -10;
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
