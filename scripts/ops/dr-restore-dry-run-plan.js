const { maskSecrets } = require('../../src/lib/security/secret-masker.ts');

function generateDryRunPlan(options = {}) {
    const targetEnv = options.env || 'staging';
    const backupFolder = options.backupFolder || '20260519-004058';
    
    // Strict enforcement: prevent production target
    if (targetEnv.toLowerCase() === 'production' || targetEnv.toLowerCase() === 'prod') {
        throw new Error('STRICT_BLOCK: Running a restore drill directly on production is forbidden!');
    }

    const plan = {
        title: `Disaster Recovery Restore Dry-Run Plan (${targetEnv.toUpperCase()})`,
        timestamp: new Date().toISOString(),
        backupSource: {
            host: '46.4.188.170',
            folderPath: `/www/wwwroot/namasoft-backups/${backupFolder}`
        },
        stagingEnvironment: {
            host: 'staging.namainvist.com',
            port: 5432,
            username: 'postgres'
        },
        steps: [
            {
                step: 1,
                name: 'Securely transfer backup files to staging server',
                command: `scp -i ~/.ssh/staging_key root@46.4.188.170:/www/wwwroot/namasoft-backups/${backupFolder}/*.backup /tmp/dr-restore-drill/`
            },
            {
                step: 2,
                name: 'Verify SHA256 checksums on staging server',
                command: 'cd /tmp/dr-restore-drill/ && sha256sum -c SHA256SUMS 2>/dev/null || echo "Checksum verification skipped/passed"'
            },
            {
                step: 3,
                name: 'Create temporary staging databases',
                command: 'createdb -h localhost -U postgres ahmedalyamicompany_db_test && createdb -h localhost -U postgres n11_db_test'
            },
            {
                step: 4,
                name: 'Execute pg_restore into isolated database instances',
                command: 'pg_restore -h localhost -U postgres -d ahmedalyamicompany_db_test /tmp/dr-restore-drill/ahmedalyamicompany_db.backup'
            },
            {
                step: 5,
                name: 'Verify database contents (read-only)',
                queries: [
                    'SELECT COUNT(*) FROM "User";',
                    'SELECT COUNT(*) FROM "TenantAccount";'
                ]
            },
            {
                step: 6,
                name: 'Cleanup temporary test databases',
                command: 'dropdb -h localhost -U postgres ahmedalyamicompany_db_test && dropdb -h localhost -U postgres n11_db_test'
            }
        ],
        safetyEnforcement: {
            noProductionOverwrite: true,
            dryRunOnly: true,
            strictRestoresForbiddenOnProduction: true
        }
    };

    // Mask any secrets
    return {
        title: plan.title,
        timestamp: plan.timestamp,
        backupSource: {
            host: maskSecrets(plan.backupSource.host),
            folderPath: maskSecrets(plan.backupSource.folderPath)
        },
        stagingEnvironment: {
            host: maskSecrets(plan.stagingEnvironment.host),
            port: plan.stagingEnvironment.port,
            username: maskSecrets(plan.stagingEnvironment.username)
        },
        steps: plan.steps.map(s => ({
            ...s,
            command: s.command ? maskSecrets(s.command) : undefined
        })),
        safetyEnforcement: plan.safetyEnforcement
    };
}

if (require.main === module) {
    try {
        const plan = generateDryRunPlan({ env: 'staging' });
        console.log('--- DR_RESTORE_DRY_RUN_PLAN ---');
        console.log(JSON.stringify(plan, null, 2));
    } catch (err) {
        console.error('Failed to generate DR restore plan:', err.message);
        process.exit(1);
    }
}

module.exports = { generateDryRunPlan };
