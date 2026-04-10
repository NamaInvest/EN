const { Client } = require('ssh2');
const fs = require('fs');

const c = new Client();
c.on('ready', () => {
    c.sftp((err, sftp) => {
        sftp.fastGet(
            '/www/wwwroot/n11.namainvist.com/.next/static/chunks/b2c0bfc75a8ec953.js',
            'b2c0_chunk.js',
            (err) => {
                if (err) { console.error(err); c.end(); return; }
                console.log('Downloaded b2c0 chunk');
                const text = fs.readFileSync('b2c0_chunk.js', 'utf8');
                console.log('Size:', text.length);
                const idx4390 = text.indexOf('sys.str_4390');
                console.log('Contains 4390:', idx4390 !== -1, idx4390 !== -1 ? text.slice(idx4390 - 30, idx4390 + 80) : '');
                const idxTranslate = text.indexOf('function translate');
                console.log('Has translate fn:', idxTranslate !== -1);
                console.log('First 500:', text.slice(0, 500));
                c.end();
            }
        );
    });
}).connect({host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b', readyTimeout:30000});
