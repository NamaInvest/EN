const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
  const cmd = `
    N1="/www/wwwroot/n1.namainvist.com"
    
    echo "=== Top-level app dirs on n1 ==="
    ls "$N1/src/app/" 2>/dev/null | sort
    
    echo ""
    echo "=== pos page status ==="
    ls "$N1/src/app/pos/" 2>/dev/null || echo "❌ pos: NOT FOUND"
    
    echo ""
    echo "=== restaurant-pos status ==="
    ls "$N1/src/app/restaurant-pos/" 2>/dev/null || echo "❌ restaurant-pos: NOT FOUND"
    
    echo ""
    echo "=== ice status ==="
    ls "$N1/src/app/ice/" 2>/dev/null || echo "❌ ice: NOT FOUND"
    
    echo ""
    echo "=== ThemeSwitcher (old or new?) ==="
    grep -c "style jsx" "$N1/src/components/ThemeSwitcher.tsx" 2>/dev/null && echo "(has styled-jsx = OLD version)" || echo "(no styled-jsx = NEW version or not found)"
    grep "inline-block" "$N1/src/components/ThemeSwitcher.tsx" 2>/dev/null | head -1
    
    echo ""
    echo "=== n1 built pos routes ==="
    ls "$N1/.next/server/app/pos/" 2>/dev/null || echo "pos not built"
    ls "$N1/.next/server/app/restaurant-pos/" 2>/dev/null || echo "restaurant-pos not built"
    
    echo ""
    echo "=== CURL test: does n1/pos work? ==="
    PORT=$(pm2 show n1-main 2>/dev/null | grep "exec interpreter" | grep -o ":[0-9]*" || echo "")
    ACTUAL_PORT=$(cat "$N1/ecosystem.config.js" 2>/dev/null | grep "PORT" | grep -o "[0-9]*" | head -1)
    echo "Config port: $ACTUAL_PORT"
    # Try common ports
    for p in 3001 3000 2999 4001; do
      STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$p/pos" --max-time 2 2>/dev/null)
      if [ "$STATUS" != "000" ]; then
        echo "Port $p /pos → HTTP $STATUS"
        break
      fi
    done
  `;
  c.exec(cmd, (err, stream) => {
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stdout.write(d.toString()));
    stream.on('close', () => c.end());
  });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
