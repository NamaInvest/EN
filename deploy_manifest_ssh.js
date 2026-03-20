const { Client } = require('ssh2');
const fs = require('fs');
const conn = new Client();

const routeCode = fs.readFileSync('src/app/api/manifest/route.ts', 'utf8').replace(/'/g, "'\\''");
const layoutCode = fs.readFileSync('src/app/layout.tsx', 'utf8').replace(/'/g, "'\\''");

const bashScript = `
#!/bin/bash
for i in {1..10}
do
  echo "Injecting into n$i..."
  DIR=/www/wwwroot/n$i.namainvist.com/src/app/api/manifest
  mkdir -p $DIR
  
  # Write route
  echo '${routeCode}' > $DIR/route.ts
  
  # Override layout
  echo '${layoutCode}' > /www/wwwroot/n$i.namainvist.com/src/app/layout.tsx
done
echo "DONE!"
`;

conn.on('ready', () => {
    conn.exec('cat << "EOF" > /root/inject_api.sh\n' + bashScript + '\nEOF\nbash /root/inject_api.sh', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            console.log("Injection completed! Triggering quick rebuild...");
            const { exec } = require('child_process');
            const child = exec("node deploy_rebuild_fast.js");
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
