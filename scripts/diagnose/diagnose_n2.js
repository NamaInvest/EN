const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    // Check timestamps of deployed files and test translate function directly
    const cmd = `
cd /www/wwwroot/n2.namainvist.com && 
echo "=== File timestamps ===" &&
ls -la src/lib/translations.ts src/lib/i18n.tsx src/components/Sidebar.tsx &&
echo "" &&
echo "=== Does EN section exist? ===" &&
grep -c '"sidebar.section.sales": "Sales' src/lib/translations.ts &&
echo "" &&
echo "=== Does Sidebar use labelKey? ===" &&
grep -c 'sidebar.item.pos' src/components/Sidebar.tsx &&
echo "" &&
echo "=== First 5 lines of built page html ===" &&
ls -la .next/server/app/ | head -5
`;
    conn.exec(cmd, (err, stream) => {
        let data = '';
        stream.on('data', d => data += d);
        stream.stderr.on('data', d => data += d);
        stream.on('close', () => {
            console.log(data);
            conn.end();
        });
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
