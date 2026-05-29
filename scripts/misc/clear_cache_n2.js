const { Client } = require('ssh2');
const conn = new Client();

// Add cache-clearing script directly to N2's layout
const clearCacheScript = `
// Auto-injected cache clearer - removes stale service workers and caches
if (typeof window !== 'undefined') {
  // Unregister all service workers
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(regs => {
      regs.forEach(r => r.unregister());
    });
  }
  // Clear all caches
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name));
    });
  }
}
`;

conn.on('ready', () => {
    // Inject cache clearing into the layout
    conn.exec(`
        cd /www/wwwroot/n2.namainvist.com &&
        # Check if cache clearer already exists
        grep -q "Unregister all service workers" src/app/layout.tsx && echo "ALREADY PATCHED" || (
            # Add cache clearer script before </body>
            sed -i 's|</body>|<script dangerouslySetInnerHTML={{__html: \`if(typeof window!=="undefined")\{if("serviceWorker" in navigator)navigator.serviceWorker.getRegistrations().then(r=>r.forEach(x=>x.unregister()));if("caches" in window)caches.keys().then(n=>n.forEach(k=>caches.delete(k)));\}\`}}></script></body>|' src/app/layout.tsx &&
            echo "PATCHED LAYOUT" &&
            rm -rf .next &&
            /usr/bin/npm run build 2>&1 | tail -5 &&
            pm2 restart n2-main &&
            echo "DONE"
        )
    `, (err, stream) => {
        let data = '';
        stream.on('data', d => { data += d; process.stdout.write(d); });
        stream.stderr.on('data', d => { data += d; process.stdout.write(d); });
        stream.on('close', () => {
            console.log('\nDone:', data.length);
            conn.end();
        });
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD'});
