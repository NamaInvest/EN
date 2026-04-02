const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmds = [
        'cd /www/wwwroot/n3.namainvist.com',
        // Is "dashboard.title" literally in any built chunk?
        'echo "--- dashboard.title in chunks ---"',
        'grep -rl "dashboard.title" .next/static/chunks/ 2>/dev/null | wc -l',
        // Is "dashboard.refresh" in any built chunk?  
        'echo "--- dashboard.refresh in chunks ---"',
        'grep -rl "dashboard.refresh" .next/static/chunks/ 2>/dev/null | wc -l',
        // Is the ARABIC TEXT for dashboard in chunks?
        'echo "--- Arabic لوحة التحكم in chunks ---"',
        'grep -rl "لوحة التحكم" .next/static/chunks/ 2>/dev/null | wc -l',
        // Is sys.str_549 in chunks (we know this works)
        'echo "--- sys.str_549 in chunks ---"',
        'grep -rl "sys.str_549" .next/static/chunks/ 2>/dev/null | wc -l',
        // Is common.sar in chunks?
        'echo "--- common.sar in chunks ---"',
        'grep -rl "common.sar" .next/static/chunks/ 2>/dev/null | wc -l',
        // Is the Arabic ر.س in chunks?
        'echo "--- Arabic ر.س in chunks ---"',
        'grep -rl "ر.س" .next/static/chunks/ 2>/dev/null | wc -l',
        // Key test: print the chunk that has sys.str_549 and check if dashboard.title is there too
        'echo "--- Same chunk has both? ---"',
        'CHUNK=$(grep -rl "sys.str_549" .next/static/chunks/ 2>/dev/null | head -1)',
        'echo "Chunk with sys.str_549: $CHUNK"',
        'grep -c "dashboard.title" "$CHUNK" 2>/dev/null || echo "dashboard.title NOT in same chunk"',
        'grep -c "common.sar" "$CHUNK" 2>/dev/null || echo "common.sar NOT in same chunk"',
    ].join(' && ');
    
    conn.exec(cmds, (err, stream) => {
        if (err) { console.error(err); conn.end(); return; }
        let out = '';
        stream.on('data', d => { out += d.toString(); });
        stream.stderr.on('data', d => {});
        stream.on('close', () => { console.log(out); conn.end(); });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
