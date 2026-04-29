const { Client } = require('ssh2');
const fs = require('fs');

const c = new Client();
c.on('ready', () => {
    // The translate fn: if(translations[lang] && translations[lang][key]) return...
    c.exec("grep -rl 'translations\\[lang\\]' /www/wwwroot/n11.namainvist.com/.next/static/chunks/ 2>/dev/null", (err, stream) => {
        let out = '';
        stream.on('data', d => { out += d.toString(); });
        stream.on('close', () => {
            if (!out.trim()) {
                // Try another approach - look for the specific translate logic
                c.exec("grep -rl '\"ar\".*\"en\".*\"hi\"' /www/wwwroot/n11.namainvist.com/.next/static/chunks/ 2>/dev/null | head -5", (err, s2) => {
                    let out2 = '';
                    s2.on('data', d => { out2 += d.toString(); });
                    s2.on('close', () => {
                        console.log('Chunk with ar/en/hi:', out2);
                        c.end();
                    });
                });
            } else {
                console.log('Chunk with translations[lang]:', out);
                c.end();
            }
        });
    });
}).connect({host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b', readyTimeout:30000});
