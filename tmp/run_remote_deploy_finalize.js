const { Client } = require('ssh2');
const fs = require('fs');

const SERVER = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
};

const urls = [
    'https://namainvist.com',
    'https://ahmedalyamicompany.namainvist.com',
    'https://ahmedalyamicompany.namainvist.com/login',
    'https://ahmedalyamicompany.namainvist.com/admin/siem',
    'https://ahmedalyamicompany.namainvist.com/crm',
    'https://ahmedalyamicompany.namainvist.com/inventory',
    'https://ahmedalyamicompany.namainvist.com/payroll',
    'https://ahmedalyamicompany.namainvist.com/projects',
    'https://ahmedalyamicompany.namainvist.com/sales/terminal',
    'https://ahmedalyamicompany.namainvist.com/api/admin/siem'
];

const conn = new Client();

conn.on('ready', async () => {
    console.log('CONNECTED TO FLEET SERVER successfully.');
    
    let report = 'PRODUCTION DEPLOY FINALIZE REPORT\n=================================\n';

    // 1. PM2 Restart
    console.log('\n--- Restarting PM2 Apps ---');
    report += '\n1. PM2 Restart:\n';
    const apps = ['main-site', 'n1-main', 'saas-app'];
    for (const app of apps) {
        await new Promise((resolve) => {
            conn.exec(`pm2 restart ${app} --update-env`, (err, stream) => {
                stream.on('data', d => {
                    process.stdout.write(d.toString());
                    report += d.toString();
                });
                stream.on('close', resolve);
            });
        });
    }

    // 2. PM2 List
    console.log('\n--- PM2 List ---');
    report += '\n2. PM2 List:\n';
    await new Promise((resolve) => {
        conn.exec('pm2 list', (err, stream) => {
            stream.on('data', d => {
                process.stdout.write(d.toString());
                report += d.toString();
            });
            stream.on('close', resolve);
        });
    });

    // 3. PM2 Logs (last 50 lines for each)
    console.log('\n--- PM2 Logs ---');
    report += '\n3. PM2 Logs:\n';
    for (const app of apps) {
        report += `\n--- Log for ${app} ---\n`;
        await new Promise((resolve) => {
            conn.exec(`pm2 logs ${app} --lines 50 --nostream`, (err, stream) => {
                stream.on('data', d => {
                    process.stdout.write(d.toString());
                    report += d.toString();
                });
                stream.on('close', resolve);
            });
        });
    }

    // 4. Runtime URL checks (curl -I)
    console.log('\n--- Runtime HTTP checks ---');
    report += '\n4. Runtime HTTP Checks:\n';
    for (const url of urls) {
        report += `\nCURL -I ${url}\n`;
        await new Promise((resolve) => {
            conn.exec(`curl -sI "${url}"`, (err, stream) => {
                stream.on('data', d => {
                    process.stdout.write(d.toString());
                    report += d.toString();
                });
                stream.on('close', resolve);
            });
        });
    }

    // 5. Exclude check for feature branches
    console.log('\n--- Feature Branch Commit Check ---');
    report += '\n5. Feature Branch Exclusion Check:\n';
    await new Promise((resolve) => {
        const cmd = 'cd /www/wwwroot/namainvist.com && (git log --oneline --all --decorate | grep -E "f4fc210d|37264398" || echo "Exclusion Verified: Feature commits absent")';
        conn.exec(cmd, (err, stream) => {
            stream.on('data', d => {
                process.stdout.write(d.toString());
                report += d.toString();
            });
            stream.on('close', resolve);
        });
    });

    fs.writeFileSync('tmp/deploy_finalize_report.txt', report);
    console.log('\nSaved final report to tmp/deploy_finalize_report.txt');
    conn.end();
}).connect(SERVER);
