const { Client } = require('ssh2');

function ssh(cmd) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => {
      console.log(`Executing: ${cmd}`);
      c.exec(cmd, (err, stream) => {
        let out = '';
        stream.on('data', d => { process.stdout.write(d); out += d; });
        stream.stderr.on('data', d => { process.stderr.write(d); out += d; });
        stream.on('close', () => { c.end(); r(out.trim()); });
      });
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
  });
}

(async () => {
  const base = '/www/wwwroot/namainvist.com';
  
  console.log(`\n=== Clearing Next.js Cache for MAIN-SITE ===`);
  await ssh(`cd ${base} && rm -rf .next`);
  
  console.log(`\n=== Building Next.js for MAIN-SITE ===`);
  await ssh(`cd ${base} && npm run build`);
  
  console.log(`\n=== Restarting PM2 MAIN-SITE ===`);
  await ssh(`pm2 restart main-site`);
  
  console.log('\n=== Done ===');
})();
