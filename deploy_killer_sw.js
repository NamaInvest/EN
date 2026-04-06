const fs = require('fs');

const killerContent = `
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => caches.delete(key)));
    })
  );
  self.registration.unregister().then(function() {
    return self.clients.matchAll();
  }).then(function(clients) {
    clients.forEach(client => client.navigate(client.url));
  });
});

self.addEventListener('fetch', (e) => {
  // bypass
});
`;

for (let i = 2; i <= 10; i++) {
  const path1 = `/www/wwwroot/n${i}.namainvist.com/public/sw.js`;
  const path2 = `/www/wwwroot/n${i}.namainvist.com/public/service-worker.js`;
  
  if (fs.existsSync(path1)) fs.writeFileSync(path1, killerContent);
  if (fs.existsSync(path2)) fs.writeFileSync(path2, killerContent);
}

console.log("Deployed Killer Service Worker to all broken nodes!");
