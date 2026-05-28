const { Client } = require('ssh2');
const fs = require('fs');

const SERVER = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
};

const conn = new Client();

const dbUrls = {
    n11_db: "postgresql://postgres@localhost:5432/n11_db?schema=public",
    n1_db: "postgresql://postgres@localhost:5432/n1_db?schema=public",
    ahmedalyamicompany_db: "postgresql://postgres@localhost:5432/ahmedalyamicompany_db?schema=public"
};

conn.on('ready', async () => {
    console.log('CONNECTED TO FLEET SERVER successfully.');
    
    let report = 'DATABASE SCHEMA DIFF REPORT\n=========================\n';

    for (const [name, url] of Object.entries(dbUrls)) {
        console.log(`\nRunning schema diff for ${name}...`);
        report += `\n-----------------------------------------\nDATABASE: ${name}\n-----------------------------------------\n`;
        
        await new Promise((resolve) => {
            const cmd = `cd /www/wwwroot/namainvist.com && npx prisma migrate diff --from-url "${url}" --to-schema-datamodel prisma/schema.prisma --script`;
            let stdout = '', stderr = '';
            
            conn.exec(cmd, (err, stream) => {
                if (err) {
                    report += `Error running diff: ${err.message}\n`;
                    return resolve();
                }
                stream.on('data', d => { stdout += d.toString(); });
                stream.stderr.on('data', d => { stderr += d.toString(); });
                stream.on('close', (code) => {
                    if (code === 0) {
                        report += stdout;
                    } else {
                        report += `Failed with exit code ${code}\nStderr:\n${stderr}\n`;
                    }
                    resolve();
                });
            });
        });
    }

    fs.writeFileSync('tmp/db_schema_diff.sql', report);
    console.log('\nSaved diff report to tmp/db_schema_diff.sql');
    conn.end();
}).connect(SERVER);
