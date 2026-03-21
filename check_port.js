const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
    c.exec('netstat -plnt | grep 3002; echo "---"; ps -aux | grep 3002', (e,s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.on('close', () => c.end());
    });
}).connect({host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b'});
