const fs = require('fs');
const cp = require('child_process');
const path = require('path');

const nodeExec = process.execPath;
const nodeDir = path.dirname(nodeExec);
let npmExec = path.join(nodeDir, 'npm');
if (!fs.existsSync(npmExec)) npmExec = 'npm'; // fallback

fs.writeFileSync('/root/build_log.txt', `Node: ${nodeExec}\nNPM: ${npmExec}\n`);

for (let i = 2; i <= 10; i++) {
  const domain = `n${i}.namainvist.com`;
  const dest = `/www/wwwroot/${domain}`;
  
  if (fs.existsSync(dest)) {
    console.log(`Syncing N1 to ${domain}...`);
    cp.execSync(`rsync -aq --delete --exclude='node_modules' --exclude='.next' --exclude='.env' --exclude='logs' --exclude='.user.ini' /www/wwwroot/n1.namainvist.com/ ${dest}/`);
    
    console.log(`Building ${domain}...`);
    try {
      cp.execSync(`fuser -k -9 ${3000+i}/tcp`);
    } catch(e) {}

    try {
      const buildOpts = { cwd: dest, stdio: 'inherit', env: { ...process.env, PATH: nodeDir + ':' + process.env.PATH } };
      cp.execSync(`${npmExec} install --legacy-peer-deps`, buildOpts);
      cp.execSync(`${nodeExec} ./node_modules/.bin/next build`, buildOpts);
      console.log(`${domain} perfectly built.`);
      fs.appendFileSync('/root/build_log.txt', `${domain} SUCCESS\n`);
    } catch(e) {
      console.error(`Failed to build ${domain}`);
      fs.appendFileSync('/root/build_log.txt', `${domain} FAILED\n`);
    }
  }
}

console.log("Reloading all PM2 services...");
try { cp.execSync(`pm2 reload all`); } catch(e){}
console.log("All done!");
