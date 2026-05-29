const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const tenantId = process.argv[2];
const port = process.argv[3];

if (!tenantId || !port) {
    console.error('Usage: node create_tenant.js <tenantId> <port>');
    console.error('Example: node create_tenant.js n2 3002');
    process.exit(1);
}

const hostIp = '46.4.188.170';
const domain = `${tenantId}.namainvist.com`;
const targetDir = `/www/wwwroot/${domain}`;
const dbName = `${tenantId}_db`;
const dbPass = `${tenantId}_pass123`;

function getFiles(dir) {
    let files = [];
    if (!fs.existsSync(dir)) return files;
    fs.readdirSync(dir).forEach(file => {
        let fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            files = files.concat(getFiles(fullPath));
        } else {
            files.push(fullPath.replace(/\\/g, '/'));
        }
    });
    return files;
}

// Get all required files
let allFiles = [];
['src', 'prisma', 'public'].forEach(dir => {
    allFiles = allFiles.concat(getFiles(dir));
});

['package.json', 'package-lock.json', 'tsconfig.json', 'next.config.ts', 'next.config.js', 'next.config.mjs', 'tailwind.config.ts', 'postcss.config.mjs', 'create_tenant.js'].forEach(file => {
    if (fs.existsSync(file)) {
        allFiles.push(file);
    }
});

const dirs = [...new Set(allFiles.map(f => path.dirname(f).replace(/\\/g, '/')))];
const conn = new Client();

conn.on('ready', () => {
    console.log(`Connected to ${hostIp}. Provisioning tenant: ${tenantId}...`);

    // 1. Setup DB
    const dbCmd = `
    sudo -u postgres psql -c "CREATE DATABASE ${dbName};" || true
    sudo -u postgres psql -c "CREATE USER ${dbName} WITH PASSWORD '${dbPass}';" || true
    sudo -u postgres psql -c "ALTER ROLE ${dbName} SET client_encoding TO 'utf8';"
    sudo -u postgres psql -c "ALTER ROLE ${dbName} SET default_transaction_isolation TO 'read committed';"
    sudo -u postgres psql -c "ALTER ROLE ${dbName} SET timezone TO 'UTC';"
    sudo -u postgres psql -c "ALTER DATABASE ${dbName} OWNER TO ${dbName};"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${dbName} TO ${dbName};"
    sudo -u postgres psql -d ${dbName} -c "ALTER SCHEMA public OWNER TO ${dbName};" || true
    `;

    console.log('1. Setting up PostgreSQL Database...');
    conn.exec(dbCmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => {});
        stream.on('close', () => {
            console.log(`✅ Database ${dbName} ready.`);
            createDirectories();
        });
    });

    // 2. Create Target Directories
    function createDirectories() {
        console.log(`2. Creating directories for ${domain}...`);
        const splitDirs = [];
        for (let i = 0; i < dirs.length; i += 10) splitDirs.push(dirs.slice(i, i + 10));
        
        let dirGroupIndex = 0;
        const createNextDirGroup = () => {
            if (dirGroupIndex >= splitDirs.length) {
                startUploads();
                return;
            }
            const mkDirCommand = splitDirs[dirGroupIndex].map(d => `mkdir -p "${targetDir}/${d}"`).join(' && ');
            conn.exec(mkDirCommand, (err, stream) => {
                if (err) throw err;
                stream.on('data', d => {});
                stream.on('close', () => {
                    dirGroupIndex++;
                    createNextDirGroup();
                });
            });
        };
        createNextDirGroup();
    }

    // 3. Upload Files
    function startUploads() {
        console.log(`3. Uploading ${allFiles.length} files to ${targetDir}...`);
        conn.sftp((err, sftp) => {
            if (err) throw err;
            let done = 0;
            let failed = 0;
            let active = 0;
            const limit = 20;
            let currentIndex = 0;
            
            const processQueue = () => {
                while (active < limit && currentIndex < allFiles.length) {
                    const file = allFiles[currentIndex++];
                    active++;
                    sftp.fastPut(path.resolve(file), `${targetDir}/${file}`, (e) => {
                        active--;
                        if (e) {
                            console.error(`Failed ${file}:`, e.message);
                            failed++;
                        } else {
                            done++;
                            if (done % 50 === 0) console.log(`Uploaded ${done}/${allFiles.length}`);
                        }
                        if (done + failed === allFiles.length) {
                            console.log(`✅ Done uploads. Success: ${done}, Failed: ${failed}.`);
                            createEnvAndDeploy();
                        } else {
                            processQueue();
                        }
                    });
                }
            };
            processQueue();
        });
    }

    // 4. Create Env, build via PM2, and Nginx setup
    function createEnvAndDeploy() {
        console.log('4. Creating Environment, launching Build & Nginx setup...');
        const envCmd = `cat << 'EOF' > ${targetDir}/.env
DATABASE_URL="postgresql://postgres:RootPassNama123@localhost:5432/${dbName}?schema=public"
NEXT_PUBLIC_API_URL="http://${domain}"
PORT=${port}
EOF`;
        
        conn.exec(envCmd, (err, stream) => {
            if (err) throw err;
            stream.on('data', d => {});
            stream.on('close', () => {
                const buildAndNginxCmd = `
                    # Setup Nginx
                    echo 'server {
                        listen 80;
                        server_name ${domain};
                        location / {
                            proxy_pass http://localhost:${port};
                            proxy_http_version 1.1;
                            proxy_set_header Upgrade $http_upgrade;
                            proxy_set_header Connection "upgrade";
                            proxy_set_header Host $host;
                            proxy_cache_bypass $http_upgrade;
                        }
                    }' > /etc/nginx/sites-available/${domain}
                    ln -sf /etc/nginx/sites-available/${domain} /etc/nginx/sites-enabled/
                    nginx -t && systemctl restart nginx
                    
                    # Install and Build
                    cd ${targetDir}
                    echo "Running npm install..."
                    npm ci --legacy-peer-deps > npm_install.log 2>&1
                    echo "Running prisma commands..."
                    npx prisma generate > prisma_generate.log 2>&1
                    npx prisma db push --accept-data-loss > prisma_push.log 2>&1
                    echo "Running prisma seed..."
                    npx tsx prisma/seed.ts > prisma_seed.log 2>&1
                    echo "Running next build..."
                    npm run build > build.log 2>&1
                    
                    # Start PM2
                    echo "Starting App Engine and WhatsApp Worker..."
                    pm2 delete ${tenantId} || true
                    pm2 delete ${tenantId}-whatsapp || true
                    pm2 start npm --name "${tenantId}" -- start -- -p ${port}
                    pm2 start npm --name "${tenantId}-whatsapp" -- run start:whatsapp
                    pm2 save
                `;
                
                const fullCmd = `nohup bash -c '${buildAndNginxCmd.replace(/'/g, "'\\''")}' > /tmp/deploy_${tenantId}.log 2>&1 &`;
                
                conn.exec(fullCmd, (e2, s2) => {
                    if (e2) throw e2;
                    s2.on('data', d => {});
                    s2.on('close', () => {
                        console.log(`✅ Build, Nginx, and PM2 scripts launched in background!`);
                        console.log(`Monitor the server at: /tmp/deploy_${tenantId}.log`);
                        conn.end();
                    });
                });
            });
        });
    }

}).on('error', (err) => {
    console.error('SSH Error:', err.message);
}).connect({ host: hostIp, port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', keepaliveInterval: 10000 });
