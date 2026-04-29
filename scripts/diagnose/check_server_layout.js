const cp = require('child_process');
const ssh = '"C:\\Windows\\System32\\OpenSSH\\ssh.exe"';
const key = '"C:\\Users\\1\\.ssh\\hetzner_key"';
const n1 = "root@46.4.188.170";

try {
  console.log("Checking layout.tsx on N1...");
  const cmd = `cat /www/wwwroot/n1.namainvist.com/src/app/layout.tsx | grep dangerouslySetInnerHTML`;
  const result = cp.execSync(`${ssh} -o StrictHostKeyChecking=no -i ${key} ${n1} "${cmd}"`);
  console.log(result.toString());
} catch(e) {
  console.log(e.message);
}
