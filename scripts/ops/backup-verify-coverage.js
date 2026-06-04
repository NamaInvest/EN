const { discoverDatabases } = require('./discover-tenant-databases');
const { generateManifest } = require('./backup-manifest-generate');
const { maskSecrets } = require('../../src/lib/security/secret-masker.ts');

async function verifyBackupCoverage() {
    try {
        const activeDbs = await discoverDatabases();
        const manifest = await generateManifest();

        const backedUpDbs = [];
        for (const file of manifest.files) {
            const match = file.name.match(/([a-z0-9_]+_db)\.backup/i);
            if (match) {
                backedUpDbs.push(match[1]);
            }
        }

        const missingDbs = activeDbs.filter(db => !backedUpDbs.includes(db));
        const coveragePercentage = activeDbs.length > 0
            ? Math.round((activeDbs.filter(db => backedUpDbs.includes(db)).length / activeDbs.length) * 100)
            : 100;

        return {
            timestamp: new Date().toISOString(),
            latestBackupFolder: manifest.backupFolder,
            totalDatabases: activeDbs.length,
            discoveredDatabases: activeDbs.map(maskSecrets),
            backedUpDatabases: backedUpDbs.map(maskSecrets),
            missingDatabases: missingDbs.map(maskSecrets),
            coveragePercentage,
            status: coveragePercentage === 100 ? 'PASS' : 'GAP_DETECTED'
        };
    } catch (err) {
        throw new Error(`Backup coverage verification failed: ${err.message}`);
    }
}

if (require.main === module) {
    verifyBackupCoverage()
        .then(report => {
            console.log('--- BACKUP_COVERAGE_VERIFICATION ---');
            console.log(JSON.stringify(report, null, 2));
        })
        .catch(err => {
            console.error('Error running backup coverage verification:', err.message);
            process.exit(1);
        });
}

module.exports = { verifyBackupCoverage };
