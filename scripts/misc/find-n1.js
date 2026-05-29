const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
  const cmd = `
    echo "=== n1 server paths ==="
    # Find n1 directory
    ls /www/wwwroot/ 2>/dev/null | grep -i "n1\\|nama" | head -10
    
    echo ""
    echo "=== PM2 processes ==="
    pm2 list 2>/dev/null | head -20
    
    echo ""
    echo "=== n1 source path ==="
    pm2 show n1 2>/dev/null | grep -i "exec path\\|cwd\\|root" | head -5
    pm2 show main-site 2>/dev/null | grep -i "exec path\\|cwd\\|root" | head -5
    
    echo ""
    echo "=== Check n1 app dir ==="
    # Try to find the n1 app
    find /www/wwwroot -maxdepth 2 -name "next.config.*" 2>/dev/null | head -10
  `;
  c.exec(cmd, (err, stream) => {
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stdout.write(d.toString()));
    stream.on('close', () => c.end());
  });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
