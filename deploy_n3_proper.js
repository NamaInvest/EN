const { Client } = require('ssh2');
const conn = new Client();
const BASE = '/www/wwwroot/n3.namainvist.com';

conn.on('ready', () => {
    console.log('Connected! Stopping N3, building, then starting...');

    // Step 1: Stop PM2 first, then build, then start
    const cmd = `cd ${BASE} && \\
        echo ">>> Stopping N3..." && \\
        pm2 stop n3 2>&1 | tail -1 && \\
        echo ">>> Removing old build..." && \\
        rm -rf .next && \\
        echo ">>> Building (this takes ~15s)..." && \\
        npm run build 2>&1 | tail -10 && \\
        echo ">>> Verifying build..." && \\
        ls -la .next/BUILD_ID && \\
        echo ">>> Starting N3..." && \\
        pm2 start n3 2>&1 | tail -1 && \\
        sleep 2 && \\
        echo ">>> Testing SSR..." && \\
        curl -s http://localhost:3003/ 2>/dev/null | head -c 500 && \\
        echo "" && \\
        echo ">>> Checking for dashboard.title in SSR..." && \\
        curl -s http://localhost:3003/ 2>/dev/null | grep -c "dashboard.title" && \\
        echo "ALL_DONE"`;

    conn.exec(cmd, (err, stream) => {
        if (err) { console.error(err); conn.end(); return; }
        let out = '';
        const timeout = setTimeout(() => { console.log('Timeout!'); conn.end(); }, 180000);
        stream.on('data', d => { out += d.toString(); process.stdout.write(d); });
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => {
            clearTimeout(timeout);
            console.log(out.includes('ALL_DONE') ? '\n\n🎉 SUCCESS!' : '\n\n❌ Issue - check output');
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 20000 });
