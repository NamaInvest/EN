const { Client } = require('ssh2');
const c = new Client();

c.on('ready', () => {
  const N11 = '/www/wwwroot/n11.namainvist.com';
  
  c.exec(`
    echo "=== Check n11 .next directory ==="
    ls "${N11}/.next/" | head -10
    
    echo ""
    echo "=== Last 10 lines of build log ==="
    tail -10 /tmp/n11_fresh_build.log 2>/dev/null
    
    echo ""
    echo "=== Built dashboard routes ==="
    ls "${N11}/.next/server/app/" | head -5
    
    echo ""
    echo "=== Restart n11 ==="
    pm2 restart n11 && echo "✅ n11 restarted"
    sleep 6
    
    echo ""
    echo "=== HTTP Tests ==="
    for route in "/dashboard" "/sales" "/products" "/manufacturing" "/api/tenant/hidden-modules"; do
      S=$(curl -s -o /dev/null -w "%{http_code}" -H "Host: n11.namainvist.com" http://localhost:3011\$route --max-time 8 2>/dev/null)
      echo "\$route: HTTP \$S"
    done
    
    echo ""
    echo "=== PM2 n11 final status ==="
    pm2 show n11 2>/dev/null | grep -E "status|uptime|↺" | head -3
  `, (err, stream) => {
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stdout.write(d.toString()));
    stream.on('close', () => c.end());
  });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
