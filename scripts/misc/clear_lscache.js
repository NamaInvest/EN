const { Client } = require('ssh2');

const c = new Client();
c.on('ready', () => {
    console.log('Connected. Clearing OpenLiteSpeed Cache...');
    
    // Command to flush all Litespeed cache and restart the web server
    const cmd = `
        rm -rf /usr/local/lsws/cachedata/* || true
        rm -rf /usr/local/lsws/cgid/* || true
        if command -v lswsctrl >/dev/null 2>&1; then lswsctrl restart; fi
        if systemctl is-active --quiet lsws; then systemctl restart lsws; fi
        if systemctl is-active --quiet openlitespeed; then systemctl restart openlitespeed; fi
        
        echo "LSCache mechanism cleared!"
    `;
    
    c.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => {
            console.log('\nCache cleared on server!');
            c.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
