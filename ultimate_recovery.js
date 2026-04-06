const fs = require('fs');
const cp = require('child_process');
const path = require('path');

const nodeExec = process.execPath;
const nodeDir = path.dirname(nodeExec);
let npmExec = path.join(nodeDir, 'npm');
let npxExec = path.join(nodeDir, 'npx');
if (!fs.existsSync(npmExec)) npmExec = 'npm';
if (!fs.existsSync(npxExec)) npxExec = 'npx';

const logFile = '/root/ultimate_recovery.log';
fs.writeFileSync(logFile, `Node: ${nodeExec}\nNPM: ${npmExec}\nNPX: ${npxExec}\nStarting Native Recovery...\n`);

const log = (msg) => {
  console.log(msg);
  fs.appendFileSync(logFile, msg + '\n');
};

for (let i = 2; i <= 10; i++) {
  const domain = `n${i}.namainvist.com`;
  const dest = `/www/wwwroot/${domain}`;
  
  if (fs.existsSync(dest)) {
    log(`\n\n--- Processing ${domain} ---`);
    
    // Step 1: Wipe the contaminated .next built from N1
    log(`Wiping corrupted .next cache...`);
    cp.execSync(`rm -rf ${dest}/.next`);

    log(`Freeing port ${3000 + i}...`);
    try { cp.execSync(`fuser -k -9 ${3000 + i}/tcp`); } catch(e) {}

    const buildOpts = { cwd: dest, stdio: 'inherit', env: { ...process.env, PATH: nodeDir + ':' + process.env.PATH } };

    try {
      // Step 2: Install with devDependencies to get Tailwind
      log(`Running npm install --include=dev...`);
      cp.execSync(`${npmExec} install --include=dev --legacy-peer-deps`, buildOpts);
      
      // Step 3: Generate Prisma explicitly to fix any db bindings
      log(`Running npx prisma generate...`);
      cp.execSync(`${npxExec} prisma generate`, buildOpts);
      
      // Step 4: Build locally to bake in the correct NEXT_PUBLIC_API_URL
      log(`Running next build...`);
      cp.execSync(`${nodeExec} ./node_modules/.bin/next build`, buildOpts);
      
      log(`${domain} SUCCESSFULLY BUILT NATIVELY!`);
    } catch(e) {
      log(`FAILED TO BUILD ${domain}! ERROR: ${e.message}`);
    }
  }
}

log("\nReloading all PM2 services...");
try { cp.execSync(`pm2 reload all`); } catch(e){}
log("ALL DONE AND RECOVERED.");
