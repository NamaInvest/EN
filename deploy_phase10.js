const { execSync } = require('child_process');

try {
  console.log("📦 Packaging Enterprise modifications...");
  execSync('powershell Compress-Archive -Path src, prisma -DestinationPath update_phase10.zip -Force', {stdio: 'inherit'});

  console.log("🚀 Uploading to Hetzner Server 3 (185.197.195.202)...");
  execSync('C:\\Windows\\System32\\OpenSSH\\scp.exe -i C:\\Users\\1\\.ssh\\id_ed25519_deploy -o StrictHostKeyChecking=no update_phase10.zip root@185.197.195.202:/var/www/namasoft/update_phase10.zip', {stdio: 'inherit'});

  console.log("⚙️ Executing Remote Server Build Sequence...");
  const remoteCmd = `cd /var/www/namasoft && unzip -oq update_phase10.zip && npx prisma generate && npx prisma db push --accept-data-loss && npm run build && pm2 restart namasoft && rm update_phase10.zip`;
  
  execSync(`C:\\Windows\\System32\\OpenSSH\\ssh.exe -i C:\\Users\\1\\.ssh\\id_ed25519_deploy -o StrictHostKeyChecking=no root@185.197.195.202 "${remoteCmd}"`, {stdio: 'inherit'});
  
  console.log("✅ Enterprise Phase 10 Deployed successfully!");
} catch (e) {
  console.error("❌ Deployment Failed:", e.message);
}
