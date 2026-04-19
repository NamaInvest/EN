const {Client} = require('ssh2');
const c = new Client();
c.on('ready', () => {
    console.log('Connected. Rebuilding main-site from scratch...');
    c.exec('cd /www/wwwroot/namainvist.com && rm -rf .next && npm run build 2>&1 | tail -15 && pm2 restart main-site && echo "=== DONE ==="', (e, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stderr.write(d.toString()));
        s.on('close', () => { console.log('\nOK!'); c.end(); });
    });
});
c.connect({host:'46.4.188.170',port:22,username:'root',password:'_ee4SWbxLVfH9b'});
