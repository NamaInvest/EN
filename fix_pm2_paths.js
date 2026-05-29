/**
 * fix_pm2_paths.js
 * ─────────────────────────────────────────────────────────────────
 * Diagnose and fix PM2 configuration pointing to wrong paths
 * The error ".next directory not found" means PM2 starts from wrong CWD
 */
const { Client } = require('ssh2');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' };

function exec(conn, cmd, print = true) {
    return new Promise((resolve, reject) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            let out = '', e = '';
            stream.on('data', d => { out += d; if (print) process.stdout.write(d); });
            stream.stderr.on('data', d => { e += d; if (print) process.stderr.write(d); });
            stream.on('close', code => resolve({ code, out, err: e }));
        });
    });
}

async function run() {
    const conn = new Client();
    await new Promise((res, rej) => conn.on('ready', res).on('error', rej).connect(SERVER));
    console.log('✅ Connected\n');

    // 1. Show PM2 config details
    console.log('═══ PM2 Process Details ═══\n');
    await exec(conn, 'pm2 show main-site 2>&1 | grep -E "script path|cwd|exec_mode|node_args|pm_cwd"', true);
    await exec(conn, 'pm2 show n1-main 2>&1 | grep -E "script path|cwd|exec_mode|pm_cwd"', true);

    // 2. Check if .next exists in the directories
    console.log('\n═══ .next Directory Check ═══\n');
    for (const dir of ['/www/wwwroot/namainvist.com', '/www/wwwroot/n1.namainvist.com', '/www/wwwroot/n11.namainvist.com']) {
        const r = await exec(conn, `ls -la ${dir}/.next/BUILD_ID 2>/dev/null && echo "EXISTS" || echo "MISSING"`, false);
        const size = await exec(conn, `du -sh ${dir}/.next 2>/dev/null | cut -f1 || echo "N/A"`, false);
        console.log(`  ${dir.split('/').pop()}: .next = ${r.out.trim()} (size: ${size.out.trim()})`);
    }

    // 3. Show ecosystem.config.js
    console.log('\n═══ Ecosystem Config ═══\n');
    await exec(conn, 'cat /www/wwwroot/namainvist.com/ecosystem.config.js 2>/dev/null || echo "No ecosystem.config.js"', true);
    await exec(conn, 'cat /root/ecosystem.config.js 2>/dev/null || echo "No root ecosystem.config.js"', true);
    await exec(conn, 'cat /etc/pm2/ecosystem.config.js 2>/dev/null || echo "No /etc/pm2 ecosystem.config.js"', true);

    // 4. Get PM2 env for main-site
    console.log('\n═══ PM2 Raw Config for main-site ═══\n');
    await exec(conn, 'pm2 show main-site 2>&1 | head -40', true);

    // 5. Build exists check
    console.log('\n═══ Build Status ═══\n');
    await exec(conn, 'ls -la /www/wwwroot/namainvist.com/.next/ 2>&1 | head -15', true);

    // 6. Fix: restart PM2 with explicit cwd and correct path
    console.log('\n═══ Fixing PM2 — Restarting with correct CWD ═══\n');
    
    // Delete old PM2 config and create fresh one
    const ecosystemContent = `module.exports = {
  apps: [
    {
      name: 'main-site',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      cwd: '/www/wwwroot/namainvist.com',
      env: { NODE_ENV: 'production', PORT: '3000' },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
    },
    {
      name: 'n1-main',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3001',
      cwd: '/www/wwwroot/n1.namainvist.com',
      env: { NODE_ENV: 'production', PORT: '3001' },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
    },
    {
      name: 'saas-dev',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3002',
      cwd: '/www/wwwroot/n11.namainvist.com',
      env: { NODE_ENV: 'production', PORT: '3002' },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
    },
  ],
};`;

    // Write ecosystem config
    await exec(conn, `cat > /root/ecosystem.config.js << 'ECOSYSTEM'\n${ecosystemContent}\nECOSYSTEM`, false);
    
    // Stop all and start fresh from ecosystem
    console.log('Stopping current PM2 processes...');
    await exec(conn, 'pm2 delete main-site n1-main saas-dev 2>/dev/null; echo "Deleted"', true);
    
    console.log('\nStarting from ecosystem.config.js...');
    await exec(conn, 'cd /root && pm2 start ecosystem.config.js 2>&1', true);
    
    await new Promise(r => setTimeout(r, 5000));
    
    console.log('\nPM2 status after fix:');
    await exec(conn, 'pm2 list 2>&1', true);
    
    // Check logs
    console.log('\nRecent main-site logs:');
    await exec(conn, 'pm2 logs main-site --lines 10 --nostream 2>&1', true);
    
    // Health check via localhost
    await new Promise(r => setTimeout(r, 5000));
    console.log('\nHealth check:');
    await exec(conn, "curl -sf --max-time 10 http://localhost:3000/api/health 2>/dev/null || echo 'Still starting...'", true);
    
    // Save PM2 state
    await exec(conn, 'pm2 save 2>&1', true);

    conn.end();
    console.log('\n✅ PM2 fix complete\n');
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
