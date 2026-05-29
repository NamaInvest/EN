const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
    c.exec('cd /www/wwwroot/n11.namainvist.com && node -e "const ar = require(\'./src/locales/ar.json\'); const t = require(\'./src/lib/translations.ts\'); console.log(\'pure json ar[4390]:\', ar[\'sys.str_4390\']);"', (err, s) => {
        s.on('data', d => console.log('node output:', d.toString()));
        s.on('close', () => c.end());
        s.stderr.on('data', d => console.error('node stderr:', d.toString()));
    });
}).connect({host:'46.4.188.170', port:22, username:'root', password:'process.env.SSH_PASSWORD', readyTimeout:30000});
