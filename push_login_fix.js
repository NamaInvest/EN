const fs = require('fs');
const cp = require('child_process');
const path = require('path');

const nodeExec = process.execPath;
const nodeDir = path.dirname(nodeExec);
const log = (m) => { console.log(m); fs.appendFileSync('/root/push_fix.log', m+'\n'); };

fs.writeFileSync('/root/push_fix.log', 'Starting push fix...\n');

// Log PM2 info for n3 vs n4
try {
  const n3info = cp.execSync('pm2 show n3-main 2>&1').toString();
  const n4info = cp.execSync('pm2 show n4-main 2>&1').toString();
  log('N3 info: ' + n3info.substring(0, 500));
  log('N4 info: ' + n4info.substring(0, 500));
} catch(e) { log('pm2 show error: ' + e.message); }

// Push the fixed login page to all broken nodes
const fixedLoginPage = fs.readFileSync('/www/wwwroot/n3.namainvist.com/src/app/login/page.tsx', 'utf8');
const fixedPage = fixedLoginPage.replace(
  'min-h-screen bg-[#02040a] text-white flex items-center justify-center font-bold text-xl',
  ''
).replace(
  '<div className="">جاري تهيئة بيئة الدخول...</div>',
  '<div style={{minHeight:"100vh",background:"#02040a",color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:"bold",fontSize:"1.25rem",fontFamily:"Cairo,sans-serif"}}>جاري تهيئة بيئة الدخول...</div>'
);

log('Fixed login page prepared. Size: ' + fixedPage.length);

for (let i = 2; i <= 10; i++) {
  if (i === 3) continue; // Skip N3 - it's working
  const domain = `n${i}.namainvist.com`;
  const dir = `/www/wwwroot/${domain}`;
  if (!fs.existsSync(dir)) continue;
  
  // Copy the EXACT working login page from N3 directly
  log(`Copying N3 working login to ${domain}...`);
  cp.execSync(`cp /www/wwwroot/n3.namainvist.com/src/app/login/page.tsx ${dir}/src/app/login/page.tsx`);
  
  // Also copy the layout to ensure CSS is referenced
  cp.execSync(`cp /www/wwwroot/n3.namainvist.com/src/app/layout.tsx ${dir}/src/app/layout.tsx 2>/dev/null || true`);
  
  log(`Rebuild ${domain}...`);
  const opts = { cwd: dir, stdio: 'inherit', env: { ...process.env, PATH: nodeDir + ':' + process.env.PATH } };
  try {
    cp.execSync(`${nodeExec} ./node_modules/.bin/next build`, opts);
    log(`${domain} BUILD OK`);
    cp.execSync(`pm2 restart n${i}-main --update-env`);
  } catch(e) {
    log(`${domain} BUILD FAILED: ${e.message}`);
  }
}

cp.execSync('pm2 save');
log('COMPLETE');
