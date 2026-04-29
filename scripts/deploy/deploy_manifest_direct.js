const { Client } = require('ssh2');
const conn = new Client();

const manifestStr = `{"name": "NamaVest ERP & POS", "short_name": "NamaVest", "description": "Enterprise Resource Planning and Offline PWA", "start_url": "/dashboard", "display": "standalone", "background_color": "#0B0E14", "theme_color": "#0B0E14", "orientation": "portrait-primary", "icons": [{"src": "/icon-192x192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable"}, {"src": "/icon-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "any"}]}`;

const b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

const bashScript = `
#!/bin/bash
for i in {1..10}
do
  echo "Injecting into n$i..."
  DIR=/www/wwwroot/n$i.namainvist.com/public
  mkdir -p $DIR
  # Write the manifest directly
  echo '${manifestStr}' > $DIR/manifest.json
  # Decode base64 to binary png directly
  echo '${b64}' | base64 -d > $DIR/icon-192x192.png
  echo '${b64}' | base64 -d > $DIR/icon-512x512.png
done
echo "DONE INJECTING PWA FILES!"
`;

conn.on('ready', () => {
    conn.exec('cat << "EOF" > /root/inject_pwa.sh\n' + bashScript + '\nEOF\nbash /root/inject_pwa.sh', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
        .on('data', (d) => process.stdout.write(d.toString()))
        .stderr.on('data', (d) => process.stderr.write(d.toString()));
    });
}).connect({
    host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b',
    readyTimeout: 20000
});
