const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
    // Check ar.json on server for 4390
    c.exec("node -e \"const ar=require('/www/wwwroot/n11.namainvist.com/src/locales/ar.json'); console.log('4390:', ar['sys.str_4390']); console.log('total:', Object.keys(ar).length);\"", (err, s) => {
        let o = '';
        s.on('data', d => { o += d.toString(); });
        s.stderr.on('data', d => { console.error('stderr:', d.toString()); });
        s.on('close', () => {
            console.log('Server ar.json:', o.trim());
            
            // Also check the i18n chunk on server for language switcher
            c.exec("grep -o '\"ar\".*\"en\"' /www/wwwroot/n11.namainvist.com/.next/static/chunks/*.js 2>/dev/null | head -3", (err2, s2) => {
                let o2 = '';
                s2.on('data', d => { o2 += d.toString(); });
                s2.on('close', () => {
                    console.log('\nLanguage codes in chunks:', o2.slice(0, 300));
                    c.end();
                });
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 30000 });
