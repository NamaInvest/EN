const { Client } = require('ssh2');
const fs = require('fs');
const conn = new Client();

// New sw.js that immediately unregisters itself and clears all caches
const newSwContent = `// Auto-unregistering service worker - clears all old caches
self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          console.log('[SW] Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('[SW] All caches cleared, unregistering...');
      return self.registration.unregister();
    })
  );
});

// Do not cache ANYTHING - pass all requests through to network
self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request));
});
`;

fs.writeFileSync('tmp_sw.js', newSwContent, 'utf8');

conn.on('ready', () => {
    console.log('Connected to N2...');
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        // Check existing sw.js
        conn.exec('cat /www/wwwroot/n2.namainvist.com/public/sw.js | head -20', (err, stream) => {
            let d = '';
            stream.on('data', x => d += x);
            stream.on('close', () => {
                console.log('=== CURRENT SW.JS ===\n' + d);
                
                // Upload new self-unregistering sw.js
                sftp.fastPut('tmp_sw.js', '/www/wwwroot/n2.namainvist.com/public/sw.js', (err) => {
                    if (err) { console.error('Upload error:', err); conn.end(); return; }
                    console.log('[✅] sw.js replaced with self-unregistering version!');
                    
                    // Restart PM2
                    conn.exec('pm2 restart n2-main', (err2, stream2) => {
                        if (err2) throw err2;
                        stream2.on('close', () => {
                            console.log('[✅] PM2 restarted - users will get fresh content on next visit!');
                            conn.end();
                            // Cleanup
                            fs.unlinkSync('tmp_sw.js');
                        });
                    });
                });
            });
        });
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD'});
