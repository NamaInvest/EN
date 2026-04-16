const { Client } = require('ssh2');

function ssh(cmd, timeout = 30000) {
  return new Promise(r => {
    const c = new Client();
    let out = '';
    const timer = setTimeout(() => { c.end(); r(out + '\n[TIMEOUT]'); }, timeout);
    c.on('ready', () => c.exec(cmd, (err, stream) => {
      if (err) { clearTimeout(timer); r('[ERROR] ' + err.message); return; }
      stream.on('data', d => out += d);
      stream.stderr.on('data', d => out += d);
      stream.on('close', () => { clearTimeout(timer); c.end(); r(out.trim()); });
    })).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
  });
}

const N11 = '/www/wwwroot/n11.namainvist.com';

// Helper: write file via python to avoid shell escaping issues
async function writeFile(path, content) {
  // Encode content as base64 to avoid escaping issues
  const b64 = Buffer.from(content).toString('base64');
  return await ssh(`echo "${b64}" | base64 -d > "${path}" && echo "✅ Written: ${path}"`, 30000);
}

(async () => {
  // ══════════════════════════════════════════
  // READ FILES FIRST
  // ══════════════════════════════════════════
  const files = [
    `${N11}/src/app/api/ai/cfo/route.ts`,
    `${N11}/src/app/api/accounting/cost-centers/route.ts`,
    `${N11}/src/app/api/sys/alerts/route.ts`,
    `${N11}/src/app/api/recurring-invoices/route.ts`,
    `${N11}/src/lib/qz.ts`,
    `${N11}/src/app/login/page.tsx`,
    `${N11}/src/components/SessionGuard.tsx`,
    `${N11}/src/app/api/zatca/route.ts`,
    `${N11}/src/app/api/enterprise/wms/route.ts`,
  ];

  for (const f of files) {
    const name = f.replace(N11, '');
    const content = await ssh(`cat "${f}" 2>&1`);
    // Write to local file
    require('fs').writeFileSync(`./tmp_${name.replace(/\//g, '_').slice(1)}`, content);
    console.log(`📄 Read: ${name} (${content.split('\n').length} lines)`);
  }
  console.log('\n✅ All files read!');
})();
