const { Client } = require('ssh2');
const c = new Client();

c.on('ready', () => {
  const N11 = '/www/wwwroot/n11.namainvist.com';
  
  c.exec(`
    echo "=== Check BUILD_ID ==="
    cat "${N11}/.next/BUILD_ID" 2>/dev/null || echo "❌ BUILD_ID missing!"
    
    echo ""
    echo "=== n11 PM2 error log (last 20 lines) ==="
    tail -20 /root/.pm2/logs/n11-error.log 2>/dev/null
    
    echo ""
    echo "=== Any running build? ==="
    pgrep -fa "next build" | grep n11 | head -3 || echo "No build running"
    
    echo ""
    echo "=== n11 fresh build log (last 20) ==="
    tail -20 /tmp/n11_fresh_build.log 2>/dev/null
    
    echo ""
    echo "=== Try FULL fresh rebuild NOW (synchronous 5 min) ==="
    cd "${N11}" && timeout 360 npm run build 2>&1 | tail -20
    echo "Build exit: $?"
    
    echo ""
    echo "=== .next after build ==="
    cat "${N11}/.next/BUILD_ID" 2>/dev/null && echo "(BUILD_ID found)" || echo "❌ Still no BUILD_ID"
    
    echo ""
    echo "=== Restart after rebuild ==="
    pm2 restart n11 && sleep 5 && echo "Status: OK"
    curl -s -o /dev/null -w "Dashboard: HTTP %{http_code}\\n" -H "Host: n11.namainvist.com" http://localhost:3011/dashboard --max-time 8
  `, (err, stream) => {
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stdout.write(d.toString()));
    stream.on('close', () => { console.log('\nDone.'); c.end(); });
  });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
