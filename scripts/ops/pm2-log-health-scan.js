const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const { scanLogContent } = require('../../src/lib/observability/safe-log-scanner');

const keyPath = process.env.SSH_KEY_PATH || path.join(process.env.USERPROFILE || '/root', '.ssh', 'hetzner_key');
const hasKey = fs.existsSync(keyPath);
const SSH_PASSWORD = process.env.SSH_PASSWORD;

const SERVER = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    privateKey: hasKey ? fs.readFileSync(keyPath) : undefined,
    password: SSH_PASSWORD
};

const SERVICES = ['main-site', 'n1-main', 'saas-app', 'staging'];

function getServiceLogs(serviceName, lines = 200) {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        conn.on('ready', () => {
            const cmd = `pm2 logs ${serviceName} --lines ${lines} --nostream`;
            conn.exec(cmd, (err, stream) => {
                if (err) {
                    conn.end();
                    return reject(err);
                }
                let stdout = '', stderr = '';
                stream.on('data', d => { stdout += d; });
                stream.stderr.on('data', d => { stderr += d; });
                stream.on('close', (code) => {
                    conn.end();
                    if (code !== 0) {
                        return reject(new Error(`Failed to get logs for ${serviceName}: ${stderr}`));
                    }
                    resolve(stdout);
                });
            });
        });
        conn.on('error', err => {
            reject(err);
        });
        conn.connect(SERVER);
    });
}

async function runLogHealthScan() {
    const report = {
        timestamp: new Date().toISOString(),
        servicesScanned: {},
        overallSecretsDetected: false
    };

    for (const service of SERVICES) {
        try {
            const logsContent = await getServiceLogs(service);
            const scanResult = scanLogContent(logsContent);
            
            report.servicesScanned[service] = {
                totalLinesAnalyzed: scanResult.totalLines,
                errorCounts: scanResult.errorCounts,
                secretsDetected: scanResult.hasSecrets,
                sampleErrors: scanResult.errorsDetected.slice(0, 10)
            };

            if (scanResult.hasSecrets) {
                report.overallSecretsDetected = true;
            }
        } catch (err) {
            report.servicesScanned[service] = {
                failed: true,
                error: err.message
            };
        }
    }

    return report;
}

if (require.main === module) {
    runLogHealthScan()
        .then(report => {
            console.log('--- PM2_LOG_HEALTH_SCAN ---');
            console.log(JSON.stringify(report, null, 2));
        })
        .catch(err => {
            console.error('Failed to run log health scan:', err.message);
            process.exit(1);
        });
}

module.exports = { runLogHealthScan };
