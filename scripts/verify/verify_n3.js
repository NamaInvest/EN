const { Client } = require('ssh2');
const conn = new Client();
const BASE = '/www/wwwroot/n3.namainvist.com';

conn.on('ready', () => {
    console.log('Connected! Verifying N3 state...');

    const cmd = `cd ${BASE}
echo "BUILD_EXISTS=$(test -d .next && echo YES || echo NO)"
echo "BUILD_ID=$(cat .next/BUILD_ID 2>/dev/null || echo MISSING)"
echo "PM2_STATUS=$(pm2 show n3 --no-color 2>/dev/null | grep 'status' | head -1 | awk '{print $NF}')"
echo "NEXT_RUNNING=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3003/ 2>/dev/null)"

# Check the actual HTML that Next.js returns for dashboard
# Need to check landing page (/) since dashboard requires auth
echo "LANDING_CHECK=$(curl -s http://localhost:3003/ 2>/dev/null | grep -c 'sys.str_1')"
echo "LANDING_ARABIC=$(curl -s http://localhost:3003/ 2>/dev/null | grep -c 'نما انفست')"

# Check error logs
echo "RECENT_ERRORS:"
pm2 logs n3 --nostream --lines 3 --err --no-color 2>&1 | grep -v "^$" | tail -3
echo "RECENT_OUT:"
pm2 logs n3 --nostream --lines 3 --out --no-color 2>&1 | grep -v "^$" | tail -3
`;

    conn.exec(cmd, (err, stream) => {
        if (err) { console.error(err); conn.end(); return; }
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.on('close', () => { console.log(out); conn.end(); });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
