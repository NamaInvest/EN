const { Client } = require('ssh2');
const fs = require('fs');
const conn = new Client();

const nextConfig = fs.readFileSync('next.config.ts', 'utf8').replace(/'/g, "'\\''").replace(/\$/g, "\\$");
const offlinePage = fs.readFileSync('src/app/~offline/page.tsx', 'utf8').replace(/'/g, "'\\''").replace(/\$/g, "\\$");

const bashScript = `
#!/bin/bash
for i in {1..10}
do
  echo "Injecting offline architecture into n$i..."
  
  DIR=/www/wwwroot/n$i.namainvist.com/src/app/~offline
  mkdir -p $DIR
  
  echo '${offlinePage}' > $DIR/page.tsx
  echo '${nextConfig}' > /www/wwwroot/n$i.namainvist.com/next.config.ts
done
echo "DONE INJECTING OFFLINE ARCHITECTURE!"
`;

conn.on('ready', () => {
    conn.exec('cat << "EOF" > /root/inject_offline.sh\n' + bashScript + '\nEOF\nbash /root/inject_offline.sh', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            console.log("Transmission complete. Rebuilding node 1 safely...");
            const { exec } = require('child_process');
            const child = exec("node build_n1_safe.js"); 
            child.stdout.on('data', console.log);
            child.stderr.on('data', console.error);
            conn.end();
        })
        .on('data', (d) => process.stdout.write(d.toString()))
        .stderr.on('data', (d) => process.stderr.write(d.toString()));
    });
}).connect({
    host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b',
    readyTimeout: 30000
});
