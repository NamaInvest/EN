const { Client } = require('ssh2');
const fs = require('fs');

const c = new Client();
c.on('ready', () => {
    c.sftp((err, sftp) => {
        sftp.fastGet('/www/wwwroot/n11.namainvist.com/.next/static/chunks/313cc35d9049817d.js', '313cc_tmp.js', (err) => {
            if (err) { console.error(err); c.end(); return; }
            const text = fs.readFileSync('313cc_tmp.js', 'utf8');
            console.log('Size:', text.length);
            
            // Find Hindi/Urdu/Bengali context
            ['Hindi', 'Urdu', 'Bengali', "'hi'", '"hi"', 'hi:', 'हिन्दी', 'বাংলা', 'اردو'].forEach(term => {
                const idx = text.indexOf(term);
                if (idx !== -1) {
                    console.log(`\n"${term}" at ${idx}:`, text.slice(Math.max(0, idx-50), idx+100));
                }
            });
            
            // Also check if it's the language switcher component
            const langIdx = text.indexOf('LanguageSwitcher');
            console.log('\nLanguageSwitcher at:', langIdx, langIdx > 0 ? text.slice(langIdx-20, langIdx+100) : '');
            
            c.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
