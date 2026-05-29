const { Client } = require('ssh2');

const hostIp = '46.4.188.170';
const targetDir = '/www/wwwroot/n1.namainvist.com';
const conn = new Client();

conn.on('ready', () => {
    console.log('Connected to ' + hostIp);
    const envContent = `DATABASE_URL="postgresql://n1_db:n1_pass123@localhost:5432/n1_db?schema=public"\nNEXT_PUBLIC_API_URL="http://n1.namainvist.com"\nPORT=3001\n`;
    const envCmd = `echo '${envContent}' > ${targetDir}/.env`;
    
    conn.exec(envCmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => {}); // Consume stream
        stream.on('close', () => {
            console.log('Created .env file on remote. Starting build process...');
            const buildCmd = `
                cd ${targetDir}
                echo "Running npm install..."
                npm ci --legacy-peer-deps > npm_install.log 2>&1
                echo "Running prisma generate..."
                npx prisma generate > prisma_generate.log 2>&1
                echo "Running db push..."
                npx prisma db push --accept-data-loss > prisma_push.log 2>&1
                echo "Running next build..."
                npm run build > build.log 2>&1
                echo "Starting PM2..."
                pm2 delete n1 || true
                pm2 start npm --name "n1" -- start -- -p 3001
                pm2 save
            `;
            
            const fullCmd = `nohup bash -c '${buildCmd.replace(/'/g, "'\\''")}' > /tmp/deploy_n1_full.log 2>&1 &`;
            conn.exec(fullCmd, (e2, s2) => {
                if (e2) throw e2;
                s2.on('data', d => {}); // Consume stream
                s2.on('close', () => {
                    console.log('Build script launched in background on ' + hostIp);
                    conn.end();
                });
            });
        });
    });
}).on('error', (err) => {
    console.error('SSH Error:', err.message);
}).connect({ host: hostIp, port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', keepaliveInterval: 10000 });
