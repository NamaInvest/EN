const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
  c.exec(`
    echo "=== Lines 585-598 in sales/page.tsx on n11 ==="
    sed -n '585,598p' /www/wwwroot/n11.namainvist.com/src/app/\\(dashboard\\)/sales/page.tsx
    
    echo ""
    echo "=== isTaxInclusive declaration ==="
    grep -n "isTaxInclusive\\|taxInclusive" /www/wwwroot/n11.namainvist.com/src/app/\\(dashboard\\)/sales/page.tsx | head -10
    
    echo ""
    echo "=== taxValue/total calculation ==="
    grep -n "taxValue\\|const total" /www/wwwroot/n11.namainvist.com/src/app/\\(dashboard\\)/sales/page.tsx | grep -v "lastInvoice\\|taxValue:\\|taxAmount\\|fmt\\|setLast\\|inv\\." | head -10
  `, (err, stream) => {
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stdout.write(d.toString()));
    stream.on('close', () => c.end());
  });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
