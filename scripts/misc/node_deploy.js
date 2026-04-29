const { execSync } = require('child_process');
const fs = require('fs');

const env = {
  ...process.env,
  DISPLAY: 'dummy',
  SSH_ASKPASS: 'c:\\Users\\1\\Desktop\\alfa\\askpass.bat',
  SSH_ASKPASS_REQUIRE: 'force'
};

try {
  console.log("Uploading script...");
  execSync('scp -o StrictHostKeyChecking=no remote_script.sh root@185.197.195.202:/var/www/namasoft/remote_script.sh', { env, stdio: 'inherit' });
  
  console.log("Executing script on server...");
  execSync('ssh -o StrictHostKeyChecking=no root@185.197.195.202 "cd /var/www/namasoft && sed -i \'s/\\r$//\' remote_script.sh && chmod +x remote_script.sh && ./remote_script.sh"', { env, stdio: 'inherit' });
  
  console.log("Deployment Successful!");
} catch (error) {
  console.error("Deployment Failed:", error.message);
}
