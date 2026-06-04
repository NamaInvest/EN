const { discoverDatabases } = require('./discover-tenant-databases');
const { maskSecrets } = require('../../src/lib/security/secret-masker.ts');

async function planBackupCoverageUpgrade() {
    try {
        const databases = await discoverDatabases();
        
        const timestamp = new Date().toISOString().replace(/T/, '-').replace(/\..+/, '').replace(/:/g, '');
        const backupFolder = `/www/wwwroot/namasoft-backups/${timestamp}`;
        
        const plan = {
            title: 'Production PostgreSQL Backup Coverage Upgrade Plan (100% Coverage Target)',
            timestamp: new Date().toISOString(),
            proposedBackupDirectory: backupFolder,
            commandsToExecuteOnServer: [
                `mkdir -p "${backupFolder}"`
            ],
            databasesToCoverage: []
        };

        for (const db of databases) {
            plan.databasesToCoverage.push({
                databaseName: maskSecrets(db),
                backupCommand: maskSecrets(`pg_dump -F c -b -v -f "${backupFolder}/${db}.backup" "${db}"`)
            });
            plan.commandsToExecuteOnServer.push(
                maskSecrets(`pg_dump -F c -b -v -f "${backupFolder}/${db}.backup" "${db}"`)
            );
        }

        // Add codebase archive command
        plan.commandsToExecuteOnServer.push(
            `tar -czf "${backupFolder}/codebase_and_dashboards.tar.gz" --exclude="node_modules" --exclude=".next" --exclude=".git" /www/wwwroot/namasoft-main`
        );

        return plan;
    } catch (err) {
        throw new Error(`Failed to plan backup coverage upgrade: ${err.message}`);
    }
}

if (require.main === module) {
    planBackupCoverageUpgrade()
        .then(plan => {
            console.log('--- BACKUP_COVERAGE_UPGRADE_PLAN ---');
            console.log(JSON.stringify(plan, null, 2));
        })
        .catch(err => {
            console.error('Failed to run backup coverage upgrade plan:', err.message);
            process.exit(1);
        });
}

module.exports = { planBackupCoverageUpgrade };
