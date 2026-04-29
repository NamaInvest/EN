const { Client } = require('ssh2');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    readyTimeout: 60000
};

const conn = new Client();
conn.on('ready', () => {
    conn.exec('echo "self.addEventListener(\'install\', e => self.skipWaiting()); self.addEventListener(\'activate\', e => { self.registration.unregister().then(() => self.clients.matchAll()).then(clients => clients.forEach(c => c.navigate(c.url))); });" > /www/wwwroot/namainvist.com/public/sw.js && echo "self.addEventListener(\'install\', e => self.skipWaiting()); self.addEventListener(\'activate\', e => { self.registration.unregister().then(() => self.clients.matchAll()).then(clients => clients.forEach(c => c.navigate(c.url))); });" > /www/wwwroot/namainvist.com/.next/static/sw.js', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            console.log('Successfully injected killer SW');
            conn.end();
        });
    });
}).on('error', console.error).connect(config);
