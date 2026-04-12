const { Client } = require('ssh2');

// Rebuild all nodes in sequence in background
const rebuildScript = `
for node in n2 n3 n4 n5 n6 n7 n8 n9 n10; do
    DIR="/www/wwwroot/$node.namainvist.com"
    echo "Rebuilding $node..."
    cd "$DIR"
    rm -rf .next
    npm run build > /tmp/rebuild_node.log 2>&1
    echo "$node built!"
done
echo "All rebuilds complete!"
`;

const conn = new Client();
conn.on('ready', () => {
    console.log('Starting background rebuild of N2-N10...');
    conn.exec(`nohup bash -c '${rebuildScript.replace(/'/g, "'\\''")}' > /tmp/all_nodes_rebuild.log 2>&1 &`, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d));
        stream.on('close', () => {
            console.log('All rebuilds launched in background!');
            console.log('Monitor progress: /tmp/all_nodes_rebuild.log');
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
