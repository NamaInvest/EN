const { Client } = require('ssh2');
const c = new Client();

c.on('ready', () => {
  const N11 = '/www/wwwroot/n11.namainvist.com';
  
  // Step 1: Kill builds + clean + start fresh build
  c.exec(`
    pkill -f "next build" 2>/dev/null; sleep 1;
    rm -f "${N11}/src/app/api/tenant/provision/route.ts";
    rm -rf "${N11}/.next";
    echo "Cleaned. Starting build...";
    cd "${N11}" && npm run build > /tmp/n11_fresh_build.log 2>&1 &
    echo "Build PID: $!"
  `, (err, stream) => {
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stdout.write(d.toString()));
    stream.on('close', () => {
      console.log('\n🔨 Build started. Monitoring progress...');
      
      // Poll every 20s for completion
      let tries = 0;
      const maxTries = 20; // 400 seconds max
      
      const poll = () => {
        tries++;
        c.exec(`tail -3 /tmp/n11_fresh_build.log 2>/dev/null`, (err, s) => {
          let out = '';
          s.on('data', d => out += d);
          s.on('close', () => {
            process.stdout.write('.');
            const done = out.includes('whatsapp-hub') || out.includes('(Static)') || out.includes('(Dynamic)');
            const failed = out.toLowerCase().includes('error:') && !out.includes('PrismaClient');
            
            if (done) {
              console.log('\n✅ Build SUCCESS!');
              // Restart n11
              c.exec(`pm2 restart n11 && echo "✅ n11 restarted" && sleep 6 && curl -s -o /dev/null -w "Dashboard: HTTP %{http_code}\\n" -H "Host: n11.namainvist.com" http://localhost:3011/dashboard --max-time 10 && pm2 show n11 | grep -E "status|uptime" | head -2`, (err, s2) => {
                s2.on('data', d => process.stdout.write(d.toString()));
                s2.on('close', () => { c.end(); console.log('\n✅ n11 fully restored!'); });
              });
            } else if (tries >= maxTries) {
              console.log('\n⚠️ Timeout. Checking build state...');
              c.exec(`
                ls "${N11}/.next/" 2>/dev/null | wc -l && echo "files in .next"
                tail -15 /tmp/n11_fresh_build.log 2>/dev/null
              `, (err, s3) => {
                s3.on('data', d => process.stdout.write(d.toString()));
                s3.on('close', () => c.end());
              });
            } else {
              setTimeout(poll, 20000);
            }
          });
        });
      };
      
      setTimeout(poll, 20000);
    });
  });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
