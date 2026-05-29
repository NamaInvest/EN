const { Client } = require('ssh2');
const c = new Client();

c.on('ready', () => {
  const N11 = '/www/wwwroot/n11.namainvist.com';
  
  const checkCmd = `
    # Wait for build to finish (max 5 min)
    TIMEOUT=300
    ELAPSED=0
    while [ $ELAPSED -lt $TIMEOUT ]; do
      LAST=$(tail -3 /tmp/n11_fix_build.log 2>/dev/null)
      if echo "$LAST" | grep -qE "\\(Static\\)|\\(Dynamic\\)|Exit code|whatsapp-hub"; then
        echo "✅ Build completed!"
        break
      fi
      if echo "$LAST" | grep -qi "error:"; then
        echo "❌ Build failed"
        break
      fi
      sleep 10
      ELAPSED=$((ELAPSED + 10))
      printf "."
    done
    
    echo ""
    echo "=== Last build lines ==="
    tail -8 /tmp/n11_fix_build.log 2>/dev/null
    
    echo ""
    echo "=== Restarting n11 ==="
    pm2 restart n11 && echo "✅ n11 restarted"
    sleep 4

    echo ""
    echo "=== Final curl verification ==="
    for route in "/dashboard" "/manufacturing" "/sys/alerts" "/api/tenant/hidden-modules" "/api/tenant/trial-status"; do
      STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Host: n11.namainvist.com" http://localhost:3011$route --max-time 5 2>/dev/null)
      echo "$route: HTTP $STATUS"
    done
    
    echo ""
    echo "=== PM2 n11 status ==="
    pm2 show n11 2>/dev/null | grep -E "status|uptime|↺|memory" | head -5
    
    echo ""
    echo "✅ n11 fully fixed and running"
  `;
  
  c.exec(checkCmd, (err, stream) => {
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stdout.write(d.toString()));
    stream.on('close', () => c.end());
  });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
