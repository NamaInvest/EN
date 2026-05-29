const { Client } = require('ssh2');

const SERVER = '46.4.188.170';

function ssh(cmd) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => {
      c.exec(cmd, (err, stream) => {
        let out = '';
        stream.on('data', d => out += d);
        stream.stderr.on('data', d => out += d);
        stream.on('close', () => { c.end(); r(out.trim()); });
      });
    }).connect({ host: SERVER, port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
  });
}

(async () => {
  console.log('=== TEST 1: Direct curl to port 2999 (bypasses Cloudflare) ===');
  const direct = await ssh('curl -s http://localhost:2999/ 2>/dev/null | grep -o "104\\|73 قسم" | head -10');
  console.log('Port 2999 response:', direct || '(empty - client component only)');
  
  console.log('\n=== TEST 2: Look for hero text in built output ===');
  const heroInBuild = await ssh('find /www/wwwroot/namainvist.com/.next -name "*.js" | xargs grep -l "73 قسم\\|73 وحدة" 2>/dev/null | head -5');
  console.log('Old hero text in JS bundles:', heroInBuild || 'NONE FOUND ✅');
  
  console.log('\n=== TEST 3: What does the build output look like? ===');
  const buildStatus = await ssh('ls /www/wwwroot/namainvist.com/.next/server/app/ 2>/dev/null | head -10 && echo "---" && cat /www/wwwroot/namainvist.com/.next/BUILD_ID 2>/dev/null');
  console.log(buildStatus);
  
  console.log('\n=== TEST 4: What is in the JS bundle for _landing? ===');
  const bundleCheck = await ssh('find /www/wwwroot/namainvist.com/.next/static/chunks -name "*.js" | xargs grep -l "_landing\\|LandingPage" 2>/dev/null | head -3');
  const bundleContent = bundleCheck ? await ssh(`grep -o "104 وحدة\\|73 قسم\\|نظام مؤسسي متكامل" ${bundleCheck.split('\n')[0]} 2>/dev/null | head -5`) : '';
  console.log('Landing bundle:', bundleCheck || 'not found');
  console.log('Bundle content snippets:', bundleContent || 'N/A');
  
  console.log('\n=== TEST 5: _landing.tsx hero section ===');
  const heroText = await ssh("grep -n 'وحدة\\|قسم\\|hero\\|Hero\\|h1\\|h2' /www/wwwroot/namainvist.com/src/app/_landing.tsx 2>/dev/null | head -20");
  console.log(heroText);
})();
