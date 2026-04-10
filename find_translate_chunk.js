const { Client } = require('ssh2');
const fs = require('fs');

const c = new Client();
c.on('ready', () => {
    // Find which chunk contains the 'translate' function or the ar.json data
    c.exec("ls -la /www/wwwroot/n11.namainvist.com/.next/static/chunks/ | grep -v test | head -40", (err, stream) => {
        let out = '';
        stream.on('data', d => { out += d.toString(); });
        stream.on('close', () => {
            console.log('Chunks:', out);
            
            // Find the translations.ts chunk - look for 'translate' export
            c.exec("grep -rl 'export.*translate\\|function translate' /www/wwwroot/n11.namainvist.com/.next/static/chunks/ 2>/dev/null | head -5", (err, s2) => {
                let out2 = '';
                s2.on('data', d => { out2 += d.toString(); });
                s2.on('close', () => {
                    console.log('Chunk with translate function:', out2);
                    c.end();
                });
            });
        });
    });
}).connect({host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b', readyTimeout:30000});
