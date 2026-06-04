const { generateDailySummary } = require('./daily-observability-summary');
const { getFailedProvisioningSummary } = require('./failed-provisioning-summary');
const { getGaPolicyStatus } = require('./ga-policy-status-summary');
const { verifyBackupCoverage } = require('./backup-verify-coverage');
const { runHealthReport } = require('./runtime-health-report');
const { maskSecrets } = require('../../src/lib/security/secret-masker.ts');

async function generateOpsMasterDailyReport() {
    try {
        const [observability, provisioning, gaPolicy, backup, health] = await Promise.all([
            generateDailySummary(),
            getFailedProvisioningSummary(),
            getGaPolicyStatus(),
            verifyBackupCoverage(),
            runHealthReport()
        ]);

        const masterReport = {
            reportDate: new Date().toISOString(),
            status: observability.overallStatus === 'HEALTHY' && backup.status === 'PASS' && health.overallSuccess ? 'OK' : 'DEGRADED',
            components: {
                observability,
                provisioning,
                gaPolicy,
                backup,
                health
            }
        };

        // Deep mask the report
        return JSON.parse(maskSecrets(JSON.stringify(masterReport)));
    } catch (err) {
        throw new Error(`Failed to generate master daily report: ${err.message}`);
    }
}

if (require.main === module) {
    generateOpsMasterDailyReport()
        .then(report => {
            console.log('--- OPERATIONS_MASTER_DAILY_REPORT ---');
            console.log(JSON.stringify(report, null, 2));
        })
        .catch(err => {
            console.error('Failed to generate operations master daily report:', err.message);
            process.exit(1);
        });
}

module.exports = { generateOpsMasterDailyReport };
