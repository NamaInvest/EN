const { Client } = require('ssh2');
const c = new Client();

c.on('ready', () => {
  const cmd = `
    # Wait for n11 to warm up
    sleep 8
    
    echo "=== n11 Final Health Check ==="
    
    # Test all key endpoints
    for route in "/dashboard" "/manufacturing" "/sys/alerts" "/pos" "/sales" "/reports" "/products" "/employees"; do
      STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Host: n11.namainvist.com" http://localhost:3011$route --max-time 8 2>/dev/null)
      echo "$route: HTTP $STATUS"
    done
    
    echo ""
    echo "=== API endpoints ==="
    for api in "/api/tenant/hidden-modules" "/api/tenant/trial-status" "/api/tenant/status" "/api/settings"; do
      STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Host: n11.namainvist.com" http://localhost:3011$api --max-time 8 2>/dev/null)
      echo "$api: HTTP $STATUS"
    done
    
    echo ""
    echo "=== n11 Errors in last 5 lines ==="
    tail -5 /root/.pm2/logs/n11-error.log 2>/dev/null | grep -v "^$" || echo "(no errors)"
    
    echo ""
    echo "=== All nodes status ==="
    pm2 list 2>/dev/null | grep -E "online|error|stopped"
  `;
  
  c.exec(cmd, (err, stream) => {
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stdout.write(d.toString()));
    stream.on('close', () => c.end());
  });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
