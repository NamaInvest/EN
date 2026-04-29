const { Client } = require('ssh2');
const fs = require('fs');
const c = new Client();
c.on('ready', () => {
    c.sftp((err, sftp) => {
        sftp.fastGet(
            '/www/wwwroot/n11.namainvist.com/.next/server/chunks/ssr/src_app_(dashboard)_settings_page_tsx_188d8751._.js',
            'settings_ssr_chunk.js',
            (err) => {
                if (err) { console.error(err); c.end(); return; }
                const text = fs.readFileSync('settings_ssr_chunk.js', 'utf8');
                console.log('Size:', text.length);
                // check for translate call
                const allTranslates = [];
                let idx = 0;
                while((idx = text.indexOf('translate', idx)) !== -1) {
                    allTranslates.push({ pos: idx, ctx: text.slice(idx-10, idx+100) });
                    idx += 9;
                }
                console.log('translate mentions:', allTranslates.length);
                allTranslates.slice(0, 5).forEach((t, i) => console.log(`[${i}]`, t.ctx));
                c.end();
            }
        );
    });
}).connect({host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b', readyTimeout:30000});
