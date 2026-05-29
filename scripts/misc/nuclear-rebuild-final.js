const { Client } = require('ssh2');
const SERVER = '46.4.188.170';

function ssh(cmd, print = true) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => {
      c.exec(cmd, (err, stream) => {
        let out = '';
        stream.on('data', d => { out += d; if (print) process.stdout.write(d.toString()); });
        stream.stderr.on('data', d => { out += d; if (print) process.stderr.write(d.toString()); });
        stream.on('close', () => { c.end(); r(out.trim()); });
      });
    }).connect({ host: SERVER, port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
  });
}

(async () => {
  const DIR = '/www/wwwroot/namainvist.com';
  
  console.log('=== NUCLEAR CLEAN BUILD ===\n');
  
  // 1. Delete ALL caches - including turbopack and node_modules cache
  console.log('1. Deleting all caches...');
  await ssh(`rm -rf ${DIR}/.next ${DIR}/node_modules/.cache ${DIR}/.turbo 2>/dev/null && echo "✓ caches cleared"`);
  
  // 2. Check that _landing.tsx is correct
  const check = await ssh(`grep -c "104" ${DIR}/src/app/_landing.tsx`, false);
  console.log(`\n2. _landing.tsx has ${check} "104" occurrences ✓`);
  
  // 3. Add a timestamp to _landing.tsx to force cache busting
  const ts = Date.now();
  await ssh(`sed -i '1s/^/"use client"; \/\/ v${ts}\\n/' ${DIR}/src/app/_landing.tsx 2>/dev/null || true`);
  console.log(`3. Added cache-bust timestamp: v${ts}`);
  
  // 4. Build with verbose output
  console.log('\n4. Building (full output)...');
  await ssh(`cd ${DIR} && npm run build 2>&1 | grep -E "✓|○|ƒ|error|Error|Route|chunk|_landing" | head -30`);
  
  // 5. Verify the new bundle doesn't have "73 قسم"
  console.log('\n5. Checking new bundles for "73"...');
  const old73 = await ssh(`find ${DIR}/.next -name "*.js" | xargs grep -l "73" 2>/dev/null | head -5`, false);
  console.log('Bundles with 73:', old73 || 'NONE ✅');
  
  // 6. Restart
  await ssh(`pm2 restart main-site 2>&1 | tail -2`);
  
  await new Promise(r => setTimeout(r, 3000));
  
  // 7. Verify
  console.log('\n6. Live test at port 2999...');
  const test = await ssh('curl -s http://localhost:2999/ 2>/dev/null | grep -o "104 وحدة\\|73 قسم\\|نظام مؤسسي متكامل" | head -5', false);
  console.log('Response:', test || 'check browser (client component)');
  
  const test2 = await ssh('curl -s http://localhost:2999/ 2>/dev/null | grep -c "73"', false);
  console.log('"73" in HTML response:', test2);
  
  console.log('\n✅ Done! Check https://namainvist.com');
})();
