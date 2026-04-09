const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
    c.exec("cat /www/wwwroot/n11.namainvist.com/src/locales/ar.json | grep -o 'sys.str_4390' | wc -l", (err, stream) => {
        stream.on('data', d => console.log('Occurrences of 4390:', d.toString().trim()));
        stream.on('close', () => c.end());
    });
}).connect({host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b', readyTimeout:30000});
