const { Client } = require('ssh2');
const config = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 60000 };

const conn = new Client();
conn.on('ready', () => {
    conn.exec("cat /www/wwwroot/namainvist.com/src/app/page.tsx | base64", (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.on('close', () => {
            const decoded = Buffer.from(out, 'base64').toString('utf8');
            // Look for useTranslation and sys.str
            const hasTrans = decoded.includes('useTranslation');
            const hasSysStr = decoded.includes('sys.str');
            const hasT = decoded.includes("t('sys.");
            console.log('useTranslation in page.tsx?', hasTrans);
            console.log('sys.str in page.tsx?', hasSysStr);
            console.log("t('sys. in page.tsx?", hasT);
            // print nav bar section
            const navIdx = decoded.indexOf('<nav');
            if (navIdx !== -1) console.log('\nNAV section:', decoded.substring(navIdx, navIdx + 600));
            conn.end();
        });
    });
}).on('error', console.error).connect(config);
