const { Client } = require('ssh2');
const fs = require('fs');
const conn = new Client();

const layoutCode = fs.readFileSync('src/app/layout.tsx', 'utf8').replace(/'/g, "'\\''").replace(/\$/g, "\\$");

const bashScript = `
#!/bin/bash
for i in {1..10}
do
  echo "Injecting layout into n$i..."
  echo '${layoutCode}' > /www/wwwroot/n$i.namainvist.com/src/app/layout.tsx
done
echo "DONE INJECTING!"
`;

conn.on('ready', () => {
    conn.exec('cat << "EOF" > /root/inject_layout.sh\n' + bashScript + '\nEOF\nbash /root/inject_layout.sh', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            console.log("Transmission complete. Initiating sequential rebuild...");
            const { exec } = require('child_process');
            const child = exec("node sequential_build_n2_n10.js"); // Wait, I need a script that builds ALL 1-10 sequentially because n1 needs it too!
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
