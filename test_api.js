const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
    c.exec('mkdir -p /www/wwwroot/n11.namainvist.com/src/app/api/test_i18n && echo "import { NextResponse } from \'next/server\';\nimport translations, { translate } from \'@/lib/translations\';\nexport async function GET() { return NextResponse.json({ val: translate(\'sys.str_4390\', \'ar\'), keys: Object.keys(translations.ar).length, hasIt: !!translations.ar[\'sys.str_4390\'], rawVal: translations.ar[\'sys.str_4390\'] }); }" > /www/wwwroot/n11.namainvist.com/src/app/api/test_i18n/route.ts && cd /www/wwwroot/n11.namainvist.com && npm run build && pm2 restart n11', (err, stream) => {
        stream.on('close', () => c.end()).on('data', d => console.log('stdout:', d.toString()));
        stream.stderr.on('data', d => console.log('stderr:', d.toString()));
    });
}).connect({host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b', readyTimeout:30000});
