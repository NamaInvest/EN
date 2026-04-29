const { Client } = require('ssh2');

const hostIp = '46.4.188.170';
const username = 'root';
const password = '_ee4SWbxLVfH9b';

const payload = "self.addEventListener('install', (e) => { self.skipWaiting(); }); self.addEventListener('activate', (e) => { e.waitUntil(self.registration.unregister().then(() => self.clients.matchAll()).then((clients) => clients.forEach(client => client.navigate(client.url)))); }); self.addEventListener('fetch', (event) => { event.respondWith(fetch(event.request)); });";

const cmd = 'for i in {2..10}; do echo "' + payload + '" | tee /www/wwwroot/n$i.namainvist.com/public/sw.js > /www/wwwroot/n$i.namainvist.com/.next/sw.js; echo "Killed PWA on n$i"; done';

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected to VPS...');
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', data => process.stdout.write(data.toString()));
        stream.stderr.on('data', data => process.stderr.write(data.toString()));
        stream.on('close', (code) => {
            console.log('\\nPWA Kill Script finished with code', code);
            conn.end();
        });
    });
}).on('error', (err) => {
    console.error('Connection err:', err);
}).connect({ host: hostIp, port: 22, username, password, keepaliveInterval: 10000 });
