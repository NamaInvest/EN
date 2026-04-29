const { Client } = require('ssh2');
const fs = require('fs');

const c = new Client();
c.on('ready', () => {
    c.sftp((err, sftp) => {
        sftp.fastGet(
            '/www/wwwroot/n11.namainvist.com/.next/static/chunks/0fc68e0985809e1e.js',
            '0fc68e_chunk.js',
            (err) => {
                if (err) { console.error(err); c.end(); return; }
                const text = fs.readFileSync('0fc68e_chunk.js', 'utf8');
                console.log('Size:', text.length);
                
                // Check for translate function
                const idxTranslate = text.indexOf('translate');
                console.log('translate at:', idxTranslate, idxTranslate !== -1 ? text.slice(idxTranslate - 10, idxTranslate + 100) : '');
                
                // Check for ar.json content
                const idx4390 = text.indexOf('sys.str_4390');
                console.log('Has 4390:', idx4390 !== -1, idx4390 !== -1 ? text.slice(idx4390 - 30, idx4390 + 80) : '');
                
                // Check what it exports
                const exportIdx = text.lastIndexOf('export');
                console.log('Last export:', text.slice(exportIdx, exportIdx + 100));
                
                c.end();
            }
        );
    });
}).connect({host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b', readyTimeout:30000});
