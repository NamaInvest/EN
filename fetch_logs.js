const cp = require('child_process');
const ssh = '"C:\\Windows\\System32\\OpenSSH\\ssh.exe"';
const key = '"C:\\Users\\1\\.ssh\\hetzner_key"';
const n1 = "root@46.4.188.170";

try {
  console.log("Fetching PM2 Logs limit 200...");
  const result = cp.execSync(`${ssh} -o StrictHostKeyChecking=no -i ${key} ${n1} "pm2 logs n1 --lines 200 --nostream"`);
  console.log(result.toString());
} catch(e) {
  console.log(e.message);
}
