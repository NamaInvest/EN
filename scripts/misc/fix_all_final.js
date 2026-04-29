const { Client } = require('ssh2');

const bashCommand = `
kill_port() {
  fuser -k $1/tcp 2>/dev/null
}

rebuild_node() {
  local num=$1
  local tenant="n$num"
  local dir="/www/wwwroot/$tenant.namainvist.com"
  local port=$((3000 + num))

  if [ -d "$dir" ]; then
    echo "Processing $tenant..."
    cd "$dir"
    npm install face-api.js qz-tray @clerk/nextjs @clerk/localizations
    rm -f "src/app/(dashboard)/sales/page_localized.tsx"
    
    kill_port "$port"
    pm2 delete "tenant-$tenant" 2>/dev/null
    pm2 delete "$tenant" 2>/dev/null
    
    echo "Building $tenant..."
    npm run build
    
    echo "Starting $tenant..."
    pm2 start npm --name "tenant-$tenant" --cwd "$dir" -- start -- -p "$port"
    pm2 save
    echo "$tenant fixed!"
  fi
}

# Fix N1 immediately in foreground
rebuild_node 1

# Kickoff others in background sequentially
(
for i in {2..11}; do
  rebuild_node $i
done
) > /root/rebuild_all.log 2>&1 &

echo "N1 is COMPLETE. The rest are building in the background."
`;

const conn = new Client();
conn.on('ready', () => {
    conn.exec(bashCommand, (err, stream) => {
        if (err) throw err;
        stream.on('data', (d) => process.stdout.write(d));
        stream.stderr.on('data', (d) => process.stdout.write(d));
        stream.on('close', () => conn.end());
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
});
