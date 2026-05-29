const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
    c.exec('mkdir -p /www/wwwroot/n11.namainvist.com/src/app/test_settings && echo "import S from \'@/app/(dashboard)/settings/page\'; export default function T(){ return <S/>; }" > /www/wwwroot/n11.namainvist.com/src/app/test_settings/page.tsx && cd /www/wwwroot/n11.namainvist.com && npm run build && pm2 restart n11', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => c.end());
    });
}).connect({host:'46.4.188.170', port:22, username:'root', password:'process.env.SSH_PASSWORD', readyTimeout:30000});
