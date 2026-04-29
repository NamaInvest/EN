const { Client } = require('ssh2');
const conn = new Client();

const NODES = [
    // { dir, pm2name, port }
    { dir: 'n1.namainvist.com', pm2: 'n1-main', port: 3001 },
    { dir: 'n2.namainvist.com', pm2: 'n2', port: 3002 },
    { dir: 'n3.namainvist.com', pm2: 'n3', port: 3003 },
    { dir: 'n4.namainvist.com', pm2: 'n4', port: 3004 },
    { dir: 'n5.namainvist.com', pm2: 'n5', port: 3005 },
    { dir: 'n6.namainvist.com', pm2: 'n6', port: 3006 },
    { dir: 'n7.namainvist.com', pm2: 'n7', port: 3007 },
    { dir: 'n8.namainvist.com', pm2: 'n8', port: 3008 },
    { dir: 'n9.namainvist.com', pm2: 'n9', port: 3009 },
    { dir: 'n10.namainvist.com', pm2: 'n10', port: 3010 },
];

conn.on('ready', () => {
    console.log('✅ Connected to Fleet server...');

    // Build the full command: for each node, fix model + rebuild
    const fixCmds = NODES.map(({ dir, pm2, port }) => {
        const fullDir = `/www/wwwroot/${dir}`;
        return `
if [ -d "${fullDir}" ]; then
  echo ""
  echo "=== Processing ${dir} ==="
  # Fix gemini model
  find "${fullDir}/src" -name "*.ts" -exec sed -i \\
    -e 's/gemini-2\\.0-flash-lite/gemini-2.5-flash/g' \\
    -e 's/gemini-1\\.5-flash/gemini-2.5-flash/g' \\
    -e 's/gemini-2\\.0-flash-001/gemini-2.5-flash/g' \\
    -e 's/gemini-2\\.0-flash"/gemini-2.5-flash"/g' \\
    {} \\; 2>/dev/null
  
  # Build
  cd "${fullDir}" && npm run build 2>&1 | tail -2
  
  # Restart or start PM2
  pm2 restart ${pm2} 2>/dev/null || \\
    pm2 start node_modules/next/dist/bin/next --name "${pm2}" --cwd "${fullDir}" -- start -p ${port}
  
  echo "✅ ${dir} → gemini-2.5-flash"
fi`;
    }).join('\n');

    // Also clean up the errored duplicate 'n1' (not 'n1-main')
    const cleanupCmd = `
echo ""
echo "=== Cleaning up errored n1 duplicate ==="
pm2 delete n1 2>/dev/null || echo "No duplicate n1 found"
pm2 save
echo ""
echo "=== FINAL PM2 STATUS ==="
pm2 list --no-color
`;

    conn.exec(fixCmds + cleanupCmd, (err, stream) => {
        if (err) { console.error(err); conn.end(); return; }
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => {
            console.log('\n🎉 All N1-N10 updated to gemini-2.5-flash!');
            conn.end();
        });
    });
}).connect({
    host: '46.4.188.170', port: 22,
    username: 'root', password: '_ee4SWbxLVfH9b'
});
