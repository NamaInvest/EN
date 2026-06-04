const { runLogHealthScan } = require('./pm2-log-health-scan');
const { maskSecrets } = require('../../src/lib/security/secret-masker.ts');

async function generateDailySummary() {
    try {
        const healthScan = await runLogHealthScan();
        const summary = {
            timestamp: new Date().toISOString(),
            totalServicesScanned: Object.keys(healthScan.servicesScanned).length,
            status: 'HEALTHY',
            issues: []
        };

        for (const [service, data] of Object.entries(healthScan.servicesScanned)) {
            if (data.failed) {
                summary.status = 'DEGRADED';
                summary.issues.push(`Service ${service} logs could not be retrieved: ${data.error}`);
                continue;
            }

            const errs = data.errorCounts;
            const totalErrors = errs.typeError + errs.prismaError + errs.http500 + errs.unhandledRejection + errs.uncaughtException;
            
            if (totalErrors > 0) {
                summary.status = 'WARNINGS_DETECTED';
                summary.issues.push(`Service ${service} has ${totalErrors} active error logs (Prisma: ${errs.prismaError}, 500: ${errs.http500}, TypeError: ${errs.typeError})`);
            }
        }

        return {
            timestamp: summary.timestamp,
            overallStatus: summary.status,
            activeIssues: summary.issues.map(maskSecrets)
        };
    } catch (err) {
        throw new Error(`Daily observability summary failed: ${err.message}`);
    }
}

if (require.main === module) {
    generateDailySummary()
        .then(summary => {
            console.log('--- DAILY_OBSERVABILITY_SUMMARY ---');
            console.log(JSON.stringify(summary, null, 2));
        })
        .catch(err => {
            console.error('Failed to run daily observability summary:', err.message);
            process.exit(1);
        });
}

module.exports = { generateDailySummary };
