const { Client } = require('ssh2');
const fs = require('fs');

const c = new Client();
c.on('ready', () => {
    c.exec("grep -rl 'sys.str_4390' /www/wwwroot/n11.namainvist.com/.next/static/chunks/ 2>/dev/null", (err, stream) => {
        let chunks = '';
        stream.on('data', d => { chunks += d.toString(); });
        stream.on('close', () => {
            const chunkList = chunks.trim().split('\n').filter(f => f.includes('.js') && !f.includes('f58ce7'));
            console.log('Settings chunks:', chunkList);
            
            if (chunkList.length > 0) {
                c.sftp((err2, sftp) => {
                    sftp.fastGet(chunkList[0], 'new_settings_chunk.js', (err3) => {
                        if (err3) { console.error(err3); c.end(); return; }
                        const text = fs.readFileSync('new_settings_chunk.js', 'utf8');
                        console.log('Size:', text.length);
                        console.log('First 1000:', text.slice(0, 1000));
                        // Check for translate import
                        const transImportIdx = text.indexOf('translate');
                        console.log('translate at:', transImportIdx, transImportIdx > 0 ? text.slice(transImportIdx - 10, transImportIdx + 60) : '');
                        c.end();
                    });
                });
            } else {
                console.log('No settings chunk found outside f58ce7');
                c.end();
            }
        });
    });
}).connect({host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b', readyTimeout:30000});
