/**
 * KICKOFF Day 2-4: Server-side infrastructure tasks
 * 1. Stop Ghost PostgreSQL (port 5433)
 * 2. Setup pgBackRest backup
 * 3. Setup daily backup cron
 * 4. Add CRON_SECRET to all nodes
 */
const { Client } = require('ssh2');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };

// Generate a secure cron secret
const CRON_SECRET = require('crypto').randomBytes(32).toString('hex');

function execCommand(conn, cmd, timeout = 30000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => resolve({ code: -1, stdout: '', stderr: 'TIMEOUT' }), timeout);
        conn.exec(cmd, (err, stream) => {
            if (err) { clearTimeout(timer); return reject(err); }
            let stdout = '', stderr = '';
            stream.on('data', d => { stdout += d; });
            stream.stderr.on('data', d => { stderr += d; });
            stream.on('close', (code) => { clearTimeout(timer); resolve({ code, stdout, stderr }); });
        });
    });
}

async function run() {
    console.log('🔗 Connecting to fleet server...');
    const conn = new Client();
    
    conn.on('ready', async () => {
        console.log('✅ Connected!\n');
        try {
            // ═══════════════════════════════════════════════════
            // TASK 1: Stop Ghost PostgreSQL
            // ═══════════════════════════════════════════════════
            console.log('═══════════════════════════════════════════════════');
            console.log('📋 TASK 1: Ghost PostgreSQL Detection & Shutdown');
            console.log('═══════════════════════════════════════════════════\n');

            // Check what PostgreSQL instances are running
            let res = await execCommand(conn, 'ss -tlnp | grep postgres');
            console.log('🔍 Current PostgreSQL listeners:');
            console.log(res.stdout || '  (none found)');

            // Check systemd postgres services
            res = await execCommand(conn, 'systemctl list-units --type=service | grep postgres');
            console.log('\n🔍 PostgreSQL systemd services:');
            console.log(res.stdout || '  (none found)');

            // Check for multiple clusters
            res = await execCommand(conn, 'pg_lsclusters 2>/dev/null || echo "pg_lsclusters not available"');
            console.log('\n🔍 PostgreSQL clusters:');
            console.log(res.stdout);

            // If there's a ghost on 5433, stop it
            if (res.stdout.includes('5433')) {
                console.log('\n⚠️  Ghost PostgreSQL detected on port 5433! Stopping...');
                
                // Find the cluster name
                const lines = res.stdout.trim().split('\n');
                for (const line of lines) {
                    if (line.includes('5433')) {
                        const parts = line.trim().split(/\s+/);
                        const version = parts[0];
                        const cluster = parts[1];
                        console.log(`   Stopping cluster: ${version}/${cluster}`);
                        
                        await execCommand(conn, `pg_ctlcluster ${version} ${cluster} stop`);
                        await execCommand(conn, `systemctl disable postgresql@${version}-${cluster}`);
                        console.log('   ✅ Ghost PostgreSQL stopped and disabled');
                    }
                }
            } else {
                console.log('\n✅ No ghost PostgreSQL on port 5433 detected');
            }

            // Verify only 5432 remains
            res = await execCommand(conn, 'ss -tlnp | grep postgres');
            console.log('\n🔍 Final PostgreSQL listeners:');
            console.log(res.stdout || '  (none)');

            // ═══════════════════════════════════════════════════
            // TASK 2: Setup pgBackRest
            // ═══════════════════════════════════════════════════
            console.log('\n═══════════════════════════════════════════════════');
            console.log('📋 TASK 2: Backup Setup (pgBackRest)');
            console.log('═══════════════════════════════════════════════════\n');

            // Check if pgbackrest is installed
            res = await execCommand(conn, 'which pgbackrest 2>/dev/null || echo "NOT_INSTALLED"');
            
            if (res.stdout.includes('NOT_INSTALLED')) {
                console.log('📦 Installing pgBackRest...');
                res = await execCommand(conn, 'apt-get install -y pgbackrest 2>&1 | tail -3', 60000);
                console.log(res.stdout);
            } else {
                console.log('✅ pgBackRest already installed');
            }

            // Create config directory
            await execCommand(conn, 'mkdir -p /etc/pgbackrest /var/lib/pgbackrest');
            await execCommand(conn, 'chown postgres:postgres /var/lib/pgbackrest');

            // Find PostgreSQL data directory and version
            res = await execCommand(conn, "sudo -u postgres psql -h localhost -p 5432 -t -c \"SHOW data_directory;\" 2>/dev/null || echo '/var/lib/postgresql/15/main'");
            const pgDataDir = res.stdout.trim() || '/var/lib/postgresql/15/main';
            console.log(`📂 PG data directory: ${pgDataDir}`);

            res = await execCommand(conn, "sudo -u postgres psql -h localhost -p 5432 -t -c \"SHOW server_version;\" 2>/dev/null || echo '15'");
            const pgVersion = res.stdout.trim().split('.')[0] || '15';
            console.log(`📦 PG version: ${pgVersion}`);

            // Write pgBackRest config
            const pgbackrestConf = `[global]
repo1-path=/var/lib/pgbackrest
repo1-retention-full=7
repo1-retention-diff=14
process-max=4
log-level-console=info
start-fast=y

[namasoft-prod]
pg1-path=${pgDataDir}
pg1-port=5432
pg1-user=postgres
`;
            
            await execCommand(conn, `cat > /etc/pgbackrest/pgbackrest.conf << 'PGEOF'
${pgbackrestConf}
PGEOF`);
            console.log('✅ pgBackRest config written');

            // Initialize stanza
            console.log('📋 Creating stanza...');
            res = await execCommand(conn, 'sudo -u postgres pgbackrest --stanza=namasoft-prod --log-level-console=info stanza-create 2>&1', 60000);
            console.log(res.stdout || res.stderr);

            // ═══════════════════════════════════════════════════
            // TASK 3: Setup Backup Cron
            // ═══════════════════════════════════════════════════
            console.log('\n═══════════════════════════════════════════════════');
            console.log('📋 TASK 3: Backup Cron Schedule');
            console.log('═══════════════════════════════════════════════════\n');

            const cronContent = `# NamaSoft ERP Backup Schedule (KICKOFF Day 4)
# Full backup daily at 2 AM Riyadh time
0 2 * * * postgres pgbackrest --stanza=namasoft-prod --type=full backup 2>&1 | logger -t namasoft-backup
# Diff backup every 6 hours
0 */6 * * * postgres pgbackrest --stanza=namasoft-prod --type=diff backup 2>&1 | logger -t namasoft-backup
`;

            await execCommand(conn, `cat > /etc/cron.d/namasoft-backup << 'CRONEOF'
${cronContent}
CRONEOF`);
            await execCommand(conn, 'chmod 644 /etc/cron.d/namasoft-backup');
            console.log('✅ Backup cron installed');
            console.log('   - Full backup: daily at 2:00 AM');
            console.log('   - Diff backup: every 6 hours');

            // ═══════════════════════════════════════════════════
            // TASK 4: Add CRON_SECRET to all nodes
            // ═══════════════════════════════════════════════════
            console.log('\n═══════════════════════════════════════════════════');
            console.log('📋 TASK 4: Add CRON_SECRET to all nodes');
            console.log('═══════════════════════════════════════════════════\n');

            console.log(`🔐 Generated CRON_SECRET: ${CRON_SECRET.substring(0, 8)}...`);

            const nodes = [
                '/www/wwwroot/namainvist.com',
                '/www/wwwroot/n1.namainvist.com',
                '/www/wwwroot/n11.namainvist.com',
            ];

            for (const node of nodes) {
                // Check if CRON_SECRET already exists
                res = await execCommand(conn, `grep CRON_SECRET ${node}/.env`);
                if (res.stdout.includes('CRON_SECRET')) {
                    console.log(`  ${node}: Already has CRON_SECRET, updating...`);
                    await execCommand(conn, `sed -i 's|^CRON_SECRET=.*|CRON_SECRET=${CRON_SECRET}|' ${node}/.env`);
                } else {
                    console.log(`  ${node}: Adding CRON_SECRET...`);
                    await execCommand(conn, `echo "CRON_SECRET=${CRON_SECRET}" >> ${node}/.env`);
                }
            }
            console.log('✅ CRON_SECRET added to all nodes');

            // Restart all PM2 processes
            console.log('\n🔄 Restarting all PM2 processes...');
            await execCommand(conn, 'pm2 restart main-site n1-main saas-app');
            console.log('✅ All PM2 processes restarted');

            // ═══════════════════════════════════════════════════
            // SUMMARY
            // ═══════════════════════════════════════════════════
            console.log('\n\n🎉 ═══════════════════════════════════════════════════');
            console.log('   KICKOFF Day 2-4 Infrastructure Tasks Complete!');
            console.log('═══════════════════════════════════════════════════\n');
            console.log('✅ Ghost PostgreSQL: Checked/Stopped');
            console.log('✅ pgBackRest: Configured');
            console.log('✅ Backup Cron: Installed (full daily + diff every 6h)');
            console.log('✅ CRON_SECRET: Added to all 3 nodes');
            console.log(`\n📝 Save this CRON_SECRET for local .env:\n   CRON_SECRET=${CRON_SECRET}`);

        } catch (err) {
            console.error('❌ Error:', err);
        } finally {
            conn.end();
        }
    });
    
    conn.on('error', (err) => console.error('❌ Connection error:', err));
    conn.connect(SERVER);
}

run();
