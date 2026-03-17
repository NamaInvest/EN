const { Client } = require('ssh2');

const conn = new Client();

console.log('Connecting to server...');

conn.on('ready', () => {
  console.log('Client :: ready');
  
  // Script initializes git, commits all current files, and force pushes to a backup branch
  const cmd = `
    cd /var/www/namasoft
    git config --global init.defaultBranch main
    git config --global user.name "Server AutoBackup"
    git config --global user.email "server@namainvest.duckdns.org"
    rm -rf .git
    git init
    git remote add origin https://github.com/iceman18ice-sketch/namasoft17-3.git
    git checkout -b server-live-backup
    git add .
    git commit -m "Auto backup of namaweb live server"
    
    # We use a personal access token or we expect the server has SSH keys? 
    # Wait, the server might not have credentials to push to this public/private repo.
    # The repo is https://github.com/iceman18ice-sketch/namasoft17-3.git
    # If it is private, it needs authentication. 
    # If we don't have a token, we can't push via HTTPS.
  `;
  
  console.log('We cannot safely push from the remote because. Wait! Let me just download it locally and push it from my authorized local environment instead of messing with remote git credentials.');
  process.exit(1);

});
