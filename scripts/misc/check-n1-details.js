const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
  const cmd = `
    echo "=== n1 built (dashboard) routes ==="
    ls /www/wwwroot/n1.namainvist.com/.next/server/app/'(dashboard)'/ 2>/dev/null | sort
    
    echo ""
    echo "=== n1 src/app/(dashboard) dirs ==="
    ls /www/wwwroot/n1.namainvist.com/src/app/'(dashboard)'/ 2>/dev/null | sort
    
    echo ""
    echo "=== Check pos specifically ==="
    ls /www/wwwroot/n1.namainvist.com/src/app/'(dashboard)'/pos/ 2>/dev/null || echo "pos: NOT FOUND"
    ls /www/wwwroot/n1.namainvist.com/src/app/'(dashboard)'/restaurant-pos/ 2>/dev/null || echo "restaurant-pos: NOT FOUND"
    
    echo ""
    echo "=== ThemeSwitcher on n1 ==="
    head -20 /www/wwwroot/n1.namainvist.com/src/components/ThemeSwitcher.tsx 2>/dev/null || echo "ThemeSwitcher not found at that path"
    find /www/wwwroot/n1.namainvist.com/src -name "ThemeSwitcher.tsx" 2>/dev/null
  `;
  c.exec(cmd, (err, stream) => {
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stdout.write(d.toString()));
    stream.on('close', () => c.end());
  });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
