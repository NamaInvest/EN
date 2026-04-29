const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
    c.exec("curl -s http://localhost:3000/test_settings", (err, stream) => {
        let output = '';
        stream.on('data', d => { output += d.toString(); });
        stream.on('close', () => {
             console.log('Contains info:', output.includes('Company Info'));
             console.log('Contains 4390:', output.includes('sys.str_4390'));
             c.end();
        });
    });
}).connect({host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b', readyTimeout:30000});
