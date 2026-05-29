const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
  const cmd = `
    echo "=== Restarting n1-main ==="
    pm2 restart n1-main && echo "✅ n1-main restarted"
    sleep 4
    
    echo ""
    echo "=== n1-main status ==="
    pm2 show n1-main | grep -E "status|↺|memory|uptime"
    
    echo ""
    echo "=== Test: curl n1/dashboard (should NOT be 404) ==="
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Host: n1.namainvist.com" http://localhost:3001/dashboard --max-time 5 2>/dev/null)
    echo "Dashboard HTTP: $STATUS"
    
    STATUS_POS=$(curl -s -o /dev/null -w "%{http_code}" -H "Host: n1.namainvist.com" http://localhost:3001/pos --max-time 5 2>/dev/null)
    echo "POS HTTP: $STATUS_POS"
    
    echo ""
    echo "=== Verify new ThemeSwitcher in build (no style jsx) ==="
    # Check if any chunk contains our new theme code
    # The old ThemeSwitcher had styled-jsx syntax
    CHUNKS_DIR="/www/wwwroot/n1.namainvist.com/.next/static/chunks"
    OLD_STYLE=$(grep -rl "style jsx" "$CHUNKS_DIR" 2>/dev/null | wc -l)
    NEW_STYLE=$(grep -rl "theme-switcher-btn\\|inline-block.*40px" "$CHUNKS_DIR" 2>/dev/null | wc -l)
    echo "Chunks with old styled-jsx: $OLD_STYLE"
    echo "Chunks with new inline style: $NEW_STYLE"
    
    echo ""
    echo "=== Show built route list for verification ==="
    cat /tmp/n1_theme_build.log 2>/dev/null | grep "ƒ /pos\\|○ /pos\\| /restaurant-pos\\|/ice " | head -5
    
    echo ""
    echo "✅ Deploy complete for n1"
  `;
  c.exec(cmd, (err, stream) => {
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stdout.write(d.toString()));
    stream.on('close', () => c.end());
  });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
