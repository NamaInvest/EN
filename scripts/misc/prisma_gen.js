const fs = require('fs');
const cp = require('child_process');
const path = require('path');

const nodeExec = process.execPath;
const npxExec = path.join(path.dirname(nodeExec), 'npx');

for (let i = 2; i <= 10; i++) {
  const domain = `n${i}.namainvist.com`;
  const dest = `/www/wwwroot/${domain}`;
  
  if (fs.existsSync(dest)) {
    console.log(`Generating Prisma for ${domain}...`);
    try {
      const opts = { cwd: dest, stdio: 'ignore' };
      cp.execSync(`${npxExec} prisma generate`, opts);
      console.log(`Prisma generated for ${domain}. Restarting...`);
      cp.execSync(`pm2 reload ${domain.split('.')[0]}-main`, opts);
    } catch(e) {
      console.error(`Failed ${domain}`);
    }
  }
}
console.log("All done!");
