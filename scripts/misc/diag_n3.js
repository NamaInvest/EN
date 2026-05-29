const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
    const cmd = [
        'echo DASHBOARD_COUNT:',
        'grep -c "dashboard\\." /www/wwwroot/n3.namainvist.com/src/lib/i18n.tsx',
        'echo COMMON_SAR_COUNT:',
        'grep -c "common.sar" /www/wwwroot/n3.namainvist.com/src/lib/i18n.tsx',
        'echo DEFAULT_T_FUNC:',
        'grep "translations..ar" /www/wwwroot/n3.namainvist.com/src/lib/i18n.tsx | head -3',
        'echo LINE_COUNT:',
        'wc -l /www/wwwroot/n3.namainvist.com/src/lib/i18n.tsx',
        'echo FILE_SIZE:',
        'stat -c%s /www/wwwroot/n3.namainvist.com/src/lib/i18n.tsx',
        'echo LOCAL_FILE_MD5:',
        'md5sum /www/wwwroot/n3.namainvist.com/src/lib/i18n.tsx',
        'echo BUILD_TIME:',
        'stat -c%Y /www/wwwroot/n3.namainvist.com/.next/BUILD_ID 2>/dev/null && date -d @$(stat -c%Y /www/wwwroot/n3.namainvist.com/.next/BUILD_ID) || echo NO_BUILD',
    ].join('; ');
    
    c.exec(cmd, (err, stream) => {
        if (err) { console.error(err); c.end(); return; }
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.stderr.on('data', d => {});
        stream.on('close', () => {
            console.log(out);
            c.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 15000 });
