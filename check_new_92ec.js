const { Client } = require('ssh2');
const fs = require('fs');

const c = new Client();
c.on('ready', () => {
    c.sftp((err, sftp) => {
        sftp.fastGet(
            '/www/wwwroot/n11.namainvist.com/.next/static/chunks/92ec0390f7932763.js',
            '92ec_new_chunk.js',
            (err) => {
                if (err) {
                    // Chunk name may have changed after rebuild - find the new one
                    c.exec("grep -rl 'useTranslation' /www/wwwroot/n11.namainvist.com/.next/static/chunks/ 2>/dev/null | head -3", (err2, stream) => {
                        let out = '';
                        stream.on('data', d => { out += d.toString(); });
                        stream.on('close', () => {
                            console.log('Chunks with useTranslation:', out);
                            c.end();
                        });
                    });
                    return;
                }
                console.log('Downloaded 92ec chunk');
                const text = fs.readFileSync('92ec_new_chunk.js', 'utf8');
                
                // Find useTranslation implementation
                const hIdx = text.indexOf('function h(');
                const useTransIdx = text.indexOf('useTranslation');
                
                console.log('useTranslation at:', useTransIdx);
                console.log('h function at:', hIdx, hIdx !== -1 ? text.slice(hIdx, hIdx + 300) : '');
                
                c.end();
            }
        );
    });
}).connect({host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b', readyTimeout:30000});
