const { Client } = require('ssh2');
const c = new Client();

c.on('ready', () => {
  const N11 = '/www/wwwroot/n11.namainvist.com';
  
  c.exec(`
    echo "=== 1. Remove provision route (imports ssh2 - incompatible with Turbopack) ==="
    rm -rf "${N11}/src/app/api/tenant/provision"
    ls "${N11}/src/app/api/tenant/" && echo "provision removed"
    
    echo ""
    echo "=== 2. Also remove trial-status if it imports ssh2 ==="
    head -5 "${N11}/src/app/api/tenant/trial-status/route.ts" 2>/dev/null
    
    echo ""
    echo "=== 3. Clean old .next ==="
    rm -rf "${N11}/.next"
    echo "Cleaned"
    
    echo ""
    echo "=== 4. Build! ==="
    cd "${N11}" && npm run build 2>&1 | grep -E "error|Error|success|BUILD|Route|whatsapp|✓|✗|warning" | tail -20
    echo "Build exit: $?"
    
    echo ""
    echo "=== 5. BUILD_ID Check ==="
    cat "${N11}/.next/BUILD_ID" 2>/dev/null && echo "(good!)" || echo "❌ FAILED"
    
    echo ""
    echo "=== 6. Restart n11 ==="
    pm2 restart n11 && sleep 5 && echo "Restarted"
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Host: n11.namainvist.com" http://localhost:3011/dashboard --max-time 8)
    echo "Dashboard: HTTP $STATUS"
    
    echo ""
    echo "=== Done ==="
    pm2 show n11 | grep -E "status|uptime" | head -2
  `, (err, stream) => {
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stdout.write(d.toString()));
    stream.on('close', () => { console.log('\nComplete.'); c.end(); });
  });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
