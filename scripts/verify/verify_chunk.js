const { Client } = require('ssh2');
const fs = require('fs');

const c = new Client();
c.on('ready', () => {
    c.exec("grep -l 'sys.str_4390' /www/wwwroot/n11.namainvist.com/.next/static/chunks/*.js 2>/dev/null", (err, stream) => {
        let out = '';
        stream.on('data', d => { out += d.toString(); });
        stream.on('close', () => {
            const chunks = out.trim().split('\n').filter(x => x && !x.includes('f58ce7'));
            console.log('Settings chunks:', chunks);
            if (chunks.length === 0) { console.log('No chunks found outside f58ce7!'); c.end(); return; }
            
            c.exec('head -c 600 ' + JSON.stringify(chunks[0]), (e, s) => {
                let txt = '';
                s.on('data', d => { txt += d.toString(); });
                s.on('close', () => {
                    console.log('Chunk start:', txt);
                    c.end();
                });
            });
        });
    });
}).connect({host:'46.4.188.170', port:22, username:'root', password:'process.env.SSH_PASSWORD', readyTimeout:30000});
