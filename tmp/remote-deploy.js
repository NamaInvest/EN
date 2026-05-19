const { Client } = require('ssh2');

const conn = new Client();
const config = {
  host: '46.4.188.170',
  port: 22,
  username: 'root',
  password: '_ee4SWbxLVfH9b',
  readyTimeout: 20000
};

const commands = [
  // 1. Env Check
  `cd /www/wwwroot/namainvist.com && echo "--- GIT STATUS ---" && git status`,
  `cd /www/wwwroot/namainvist.com && echo "--- GIT BRANCH ---" && git branch`,
  `echo "--- PM2 STATUS ---" && pm2 status`,
  `echo "--- NODE VERSION ---" && node -v`,
  `echo "--- NPM VERSION ---" && npm -v`,
  `cd /www/wwwroot/namainvist.com && echo "--- PRISMA VERSION ---" && npx prisma version`,
  
  // 2. Backups
  `cd /www/wwwroot/namainvist.com && echo "--- BACKUPS ---" && cp .env .env.backup-$(date +%F) && cp prisma/schema.prisma prisma/schema.prisma.backup-$(date +%F) && echo "Backups created"`,
  
  // 3. Git Pull
  `cd /www/wwwroot/namainvist.com && echo "--- GIT PULL ---" && git pull origin main`,
  
  // 4. Install
  `cd /www/wwwroot/namainvist.com && echo "--- NPM INSTALL ---" && npm install`,
  
  // 5. Prisma Check
  `cd /www/wwwroot/namainvist.com && echo "--- PRISMA VALIDATE ---" && npx prisma validate`,
  `cd /www/wwwroot/namainvist.com && echo "--- PRISMA GENERATE ---" && npx prisma generate`,
  
  // 6. Build
  `cd /www/wwwroot/namainvist.com && echo "--- NPM BUILD ---" && npm run build`,
  
  // 8. Restart PM2 gradually
  `echo "--- PM2 RESTART ---" && pm2 restart saas-app --update-env || echo "saas-app not found"`,
  `pm2 restart main-site --update-env || echo "main-site not found"`,
  `pm2 restart n1-main --update-env || echo "n1-main not found"`,
  
  // 9. Logs
  `echo "--- PM2 LOGS ---" && pm2 logs --lines 30 --nostream`
];

conn.on('ready', () => {
  console.log('SSH connection established');
  
  let i = 0;
  const execNext = () => {
    if (i >= commands.length) {
      console.log('All commands executed successfully');
      conn.end();
      return;
    }
    const cmd = commands[i++];
    console.log(`\nExecuting: ${cmd}`);
    conn.exec(cmd, (err, stream) => {
      if (err) {
        console.error(err);
        conn.end();
        return;
      }
      stream.on('close', (code, signal) => {
        console.log(`Command exited with code ${code}`);
        execNext();
      }).on('data', (data) => {
        process.stdout.write(data);
      }).stderr.on('data', (data) => {
        process.stderr.write(data);
      });
    });
  };
  
  execNext();
}).on('error', (err) => {
  console.error('SSH connection error:', err);
}).connect(config);
