const { Client } = require('ssh2');
const fs = require('fs');

const N1 = '/www/wwwroot/n1.namainvist.com';

function ssh(cmd, client) {
  return new Promise(r => {
    client.exec(cmd, (err, stream) => {
      let out = '';
      stream.on('data', d => out += d);
      stream.stderr.on('data', d => out += d);
      stream.on('close', () => r(out));
    });
  });
}

async function run() {
  const c = new Client();
  await new Promise(r => c.on('ready', r).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' }));

  // 1. Read pos page.tsx
  console.log('=== /pos/page.tsx on n1 ===');
  const posPage = await ssh(`cat "${N1}/src/app/pos/page.tsx" 2>/dev/null | head -50`, c);
  console.log(posPage);

  // 2. Check n1 port
  console.log('\n=== n1 port ===');
  const port = await ssh(`
    cat "${N1}/ecosystem.config.js" 2>/dev/null | grep -i "port\\|PORT" | head -5
    cat "${N1}/.env" 2>/dev/null | grep -i "port\\|PORT" | head -5
    grep -r "n1-main\\|3001\\|3002" /etc/nginx/conf.d/ /www/server/panel/vhost/nginx/n1* 2>/dev/null | grep "proxy_pass" | head -5
  `, c);
  console.log(port);

  // 3. Check middleware.ts on n1 (it might be different)
  console.log('\n=== middleware.ts on n1 ===');
  const mw = await ssh(`cat "${N1}/src/middleware.ts" 2>/dev/null | head -80`, c);
  console.log(mw);

  // 4. Upload fixed ThemeSwitcher
  console.log('\n=== Uploading fixed ThemeSwitcher to n1 ===');
  const newTheme = fs.readFileSync('src/components/ThemeSwitcher.tsx', 'utf8');
  await ssh(`cat > "${N1}/src/components/ThemeSwitcher.tsx" << 'THEMEEOF'
${newTheme}
THEMEEOF
echo "✅ ThemeSwitcher uploaded ($(wc -c < "${N1}/src/components/ThemeSwitcher.tsx") bytes)"`, c);

  // 5. Verify upload
  const verify = await ssh(`grep -c "inline-block" "${N1}/src/components/ThemeSwitcher.tsx" && echo "✅ New version confirmed" || echo "❌ Old version still there"`, c);
  console.log('Verify:', verify);

  c.end();
}

run().catch(console.error);
