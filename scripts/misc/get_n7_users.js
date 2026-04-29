const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    const cmd = `
echo "=== كل المستخدمين في n7 (عبر API) ==="
curl -s http://127.0.0.1:3600/api/users 2>/dev/null | node -e "
const chunks = [];
process.stdin.on('data', d => chunks.push(d));
process.stdin.on('end', () => {
    try {
        const data = JSON.parse(Buffer.concat(chunks));
        const users = Array.isArray(data) ? data : data.users || data.data || [];
        users.forEach(u => console.log(JSON.stringify({id:u.id, username:u.username, role:u.role, fullName:u.fullName})));
    } catch(e) {
        // print raw
        console.log(Buffer.concat(chunks).toString().slice(0,500));
    }
});
" 2>/dev/null

echo "=== cwd الحالي لـ saas-dev ==="
cat /www/wwwroot/n7.namainvist.com/ecosystem.n7.config.js 2>/dev/null | grep -E "cwd|PORT|TENANT|DATABASE"

echo "=== DATABASE_URL من aaPanel env ==="
pmx_id=$(pm2 id saas-dev 2>/dev/null)
pm2 show saas-dev 2>/dev/null | grep -E "cwd|DATABASE_URL|exec cwd"
`;
    conn.exec(cmd, (err, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stderr.write(d.toString()));
        s.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
