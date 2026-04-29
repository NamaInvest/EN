const { Client } = require('ssh2');
const fs = require('fs');

const c = new Client();
c.on('ready', () => {
    c.sftp((err, sftp) => {
        sftp.fastGet(
            '/www/wwwroot/n11.namainvist.com/.next/static/chunks/92ec0390f7932763.js',
            '92ec_chunk.js',
            (err) => {
                if (err) { console.error(err); c.end(); return; }
                const text = fs.readFileSync('92ec_chunk.js', 'utf8');
                console.log('Size:', text.length);
                
                // Check for translate function
                const idxFn = text.indexOf('function translate');  // won't be named this in minified
                const idxT = text.indexOf('translate');
                console.log('translate mentions at:', idxT, idxT !== -1 ? text.slice(idxT - 5, idxT + 120) : '');
                
                // Check for ar.json content
                const idx4390 = text.indexOf('sys.str_4390');
                console.log('Has 4390:', idx4390 !== -1, idx4390 !== -1 ? text.slice(idx4390 - 30, idx4390 + 80) : '');
                
                // Check first 600 chars
                console.log('First 600:', text.slice(0, 600));
                
                c.end();
            }
        );
    });
}).connect({host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b', readyTimeout:30000});
