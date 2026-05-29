const { Client } = require('ssh2');
const c = new Client();

c.on('ready', () => {
    // Check 1: does ar.json on server have the key?
    c.exec("python3 -c \"import json; d=json.load(open('/www/wwwroot/n11.namainvist.com/src/locales/ar.json')); print('ar.json 4390:', d.get('sys.str_4390', 'MISSING')); print('ar.json total:', len(d))\"", (err, s1) => {
        s1.on('data', d => console.log('[Python check]', d.toString().trim()));
        s1.on('close', () => {
            // Check 2: Does the translations.ts file import from locales?
            c.exec("head -5 /www/wwwroot/n11.namainvist.com/src/lib/translations.ts", (err, s2) => {
                s2.on('data', d => console.log('[translations.ts]', d.toString().trim()));
                s2.on('close', () => {
                    // Check 3: Check Next.js tsconfig - does it resolve JSON?
                    c.exec("cat /www/wwwroot/n11.namainvist.com/tsconfig.json | grep resolveJson", (err, s3) => {
                        s3.on('data', d => console.log('[resolveJsonModule]', d.toString().trim()));
                        s3.on('close', () => {
                            // Check 4: Check the built d585aaa053ae6ee6.js chunk content around 4390
                            c.exec("grep -o '\"sys.str_4390\":\"[^\"]*\"' /www/wwwroot/n11.namainvist.com/.next/static/chunks/d585aaa053ae6ee6.js", (err, s4) => {
                                s4.on('data', d => console.log('[d585 chunk 4390]', d.toString().trim()));
                                s4.on('close', () => c.end());
                            });
                        });
                    });
                });
            });
        });
    });
}).connect({host:'46.4.188.170', port:22, username:'root', password:'process.env.SSH_PASSWORD', readyTimeout:30000});
