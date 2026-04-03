const cp = require('child_process');
const ssh = '"C:\\Windows\\System32\\OpenSSH\\ssh.exe"';
const key = '"C:\\Users\\1\\.ssh\\hetzner_key"';
const n1 = "root@46.4.188.170";

try {
  console.log("Checking zip on N1...");
  const cmd = `cd /www/wwwroot/n1.namainvist.com && unzip -o grand_update.zip`;
  const result = cp.execSync(`${ssh} -o StrictHostKeyChecking=no -i ${key} ${n1} "${cmd}"`);
  console.log("Success");
} catch(e) {
  console.log("Error details:", e.stdout ? e.stdout.toString() : '');
  console.log("Error details stderr:", e.stderr ? e.stderr.toString() : '');
}
