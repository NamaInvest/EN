const { Client } = require('ssh2');
const fs = require('fs');

const c = new Client();
c.on('ready', () => {
    c.sftp((err, sftp) => {
        sftp.fastGet(
            '/www/wwwroot/n11.namainvist.com/.next/static/chunks/d585aaa053ae6ee6.js',
            'd585_chunk.js',
            (err) => {
                if (err) { console.error(err); c.end(); return; }
                console.log('Downloaded d585 chunk');
                const text = fs.readFileSync('d585_chunk.js', 'utf8');
                const idx = text.indexOf('sys.str_4390');
                console.log('Index of 4390:', idx);
                if (idx > -1) {
                    console.log('Context around 4390:', text.slice(idx - 50, idx + 100));
                }
                c.end();
            }
        );
    });
}).connect({host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b', readyTimeout:30000});
