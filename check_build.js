const { Client } = require('ssh2');
new Client().on('ready', function() {
    this.exec(`
echo "=== Build flags ==="
ls -la /tmp/f_saas.flag /tmp/f_main.flag /tmp/e2_saas.flag /tmp/e2_main.flag 2>/dev/null || echo "none"
echo ""
echo "=== PM2 status ==="
pm2 list | grep -E "saas|main"
echo ""
echo "=== Last 5 lines of SAAS build ==="
tail -5 /tmp/f_saas.log 2>/dev/null
echo ""
echo "=== Last 5 lines of MAIN build ==="
tail -5 /tmp/f_main.log 2>/dev/null
    `, (e, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stderr.write(d.toString()));
        s.on('close', () => this.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
