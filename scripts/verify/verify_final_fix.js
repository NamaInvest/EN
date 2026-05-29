const { Client } = require('ssh2');
const fs = require('fs');

const c = new Client();
c.on('ready', () => {
    c.exec("grep -rl 'sys.str_4390' /www/wwwroot/n11.namainvist.com/.next/static/chunks/ 2>/dev/null", (err, stream) => {
        let chunks = '';
        stream.on('data', d => { chunks += d.toString(); });
        stream.on('close', () => {
            const chunkList = chunks.trim().split('\n').filter(Boolean);
            console.log('Chunks with 4390:', chunkList);
            
            // Download the settings page chunk
            const settingsChunk = chunkList.find(f => f.includes('.js') && !f.includes('f58ce7'));
            if (settingsChunk) {
                c.sftp((err2, sftp) => {
                    sftp.fastGet(settingsChunk, 'settings_new_chunk.js', (err3) => {
                        if (err3) { console.error(err3); c.end(); return; }
                        const text = fs.readFileSync('settings_new_chunk.js', 'utf8');
                        const idx_n_eq = text.indexOf('n=o(e=>e)');
                        const idx_n_eq2 = text.indexOf('let n=o(');
                        console.log('Has n=o(e=>e):', idx_n_eq !== -1, idx_n_eq !== -1 ? text.slice(idx_n_eq-10, idx_n_eq+60) : '');
                        console.log('Has let n=o:', idx_n_eq2 !== -1, idx_n_eq2 !== -1 ? text.slice(idx_n_eq2-10, idx_n_eq2+80) : '');
                        c.end();
                    });
                });
            } else {
                console.log('Could not find settings chunk');
                c.end();
            }
        });
    });
}).connect({host:'46.4.188.170', port:22, username:'root', password:'process.env.SSH_PASSWORD', readyTimeout:30000});
