const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
  const cmd = `
    echo "=== n1 app directory ==="
    N1_DIR=""
    # Find n1 process cwd
    if pm2 show n1-main 2>/dev/null | grep "exec cwd" | grep -q "/"; then
      N1_DIR=$(pm2 show n1-main 2>/dev/null | grep "exec cwd" | awk '{print $NF}')
    elif [ -d "/www/wwwroot/n1.namainvist.com" ]; then
      N1_DIR="/www/wwwroot/n1.namainvist.com"
    fi
    echo "n1 dir: $N1_DIR"
    
    echo ""
    echo "=== Check n1 cwd from pm2 ==="
    pm2 show n1-main 2>/dev/null | grep -E "exec cwd|script path|pm2 Home" | head -5

    echo ""
    echo "=== n1 directory contents ==="  
    ls /www/wwwroot/n1.namainvist.com/ 2>/dev/null | head -20

    echo ""
    echo "=== Check 5 missing pages on n1 ==="
    BASEDIR="/www/wwwroot/n1.namainvist.com/src/app"
    
    # need to handle (dashboard) parentheses
    DASH_DIR="\${BASEDIR}/(dashboard)"
    
    for p in "pos" "restaurant-pos" "ice" "dashboard" "sales"; do
      if [ -d "\${DASH_DIR}/\${p}" ]; then
        if [ -f "\${DASH_DIR}/\${p}/page.tsx" ]; then
          echo "✅ /\${p} — page.tsx exists"
        else
          echo "📁 /\${p} — dir exists but NO page.tsx"
          ls "\${DASH_DIR}/\${p}/"
        fi
      else
        echo "❌ /\${p} — DIRECTORY MISSING"
      fi
    done

    echo ""
    echo "=== n1 build info ==="
    ls /www/wwwroot/n1.namainvist.com/.next/server/app/ 2>/dev/null | head -15
  `;
  c.exec(cmd, (err, stream) => {
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stdout.write(d.toString()));
    stream.on('close', () => c.end());
  });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
