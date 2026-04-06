const fs = require("fs");
const cp = require("child_process");

console.log("Fixing Nginx configs...");
for (let i = 2; i <= 10; i++) {
  const confPath = `/www/server/panel/vhost/nginx/n${i}.namainvist.com.conf`;
  if (fs.existsSync(confPath)) {
    let content = fs.readFileSync(confPath, "utf-8");
    content = content.replace(/location\s+~\s+\.\*\\\.[\s\S]*?access_log\s+\/dev\/null;\s*\n\s*\}/g, "# STATIC INTERCEPTION DISABLED FOR NEXTJS");
    content = content.replace(/location\s+~\s+\^\\\/\\\.user\\\.ini[\s\S]*?return\s+404;\s*\n\s*\}/g, "# SECURITY DENY DISABLED");
    fs.writeFileSync(confPath, content);
    console.log(`Patched Nginx config for N${i}`);
  }
}

console.log("Restarting Nginx...");
cp.execSync("systemctl restart nginx");

for (let i = 3; i <= 10; i++) {
  const dest = `/www/wwwroot/n${i}.namainvist.com`;
  console.log(`Cloning N2 code cleanly to N${i}...`);
  cp.execSync(`rsync -avq --exclude 'node_modules' --exclude '.next' /www/wwwroot/n2.namainvist.com/src/ ${dest}/src/`);
}

for (let i = 2; i <= 10; i++) {
  const domain = `n${i}.namainvist.com`;
  const port = 3000 + i;
  console.log(`Building ${domain} on port ${port}...`);
  try { cp.execSync(`fuser -k -9 ${port}/tcp`); } catch(e){}
  
  cp.execSync(`cd /www/wwwroot/${domain} && npm run build`, {stdio: 'inherit'});
  console.log(`${domain} perfectly built.`);
}

console.log("Reloading PM2 globally...");
cp.execSync("pm2 reload all");
console.log("ALL TASKS COMPLETED FLAWLESSLY.");
