const { Client } = require('ssh2');
const fs = require('fs');

const SERVER = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
};

const dbs = ['n11_db', 'n1_db', 'ahmedalyamicompany_db'];

const conn = new Client();

conn.on('ready', async () => {
    console.log('CONNECTED TO FLEET SERVER successfully.');
    
    let report = 'DATABASE HISTORY & AUDIT REPORT\n==============================\n';

    for (const dbName of dbs) {
        report += `\n=========================================\nDATABASE: ${dbName}\n=========================================\n`;
        
        // 1. Check migrations table
        report += '\n1. Prisma Migrations:\n';
        await new Promise((resolve) => {
            const sql = 'SELECT id, checksum, finished_at, migration_name FROM "_prisma_migrations" ORDER BY finished_at DESC LIMIT 10;';
            const cmd = `psql -h localhost -p 5432 -U postgres -d ${dbName} -c "${sql}"`;
            conn.exec(cmd, (err, stream) => {
                let stdout = '', stderr = '';
                stream.on('data', d => { stdout += d.toString(); });
                stream.stderr.on('data', d => { stderr += d.toString(); });
                stream.on('close', () => {
                    if (stderr.includes('does not exist')) {
                        report += 'Table "_prisma_migrations" does not exist.\n';
                    } else {
                        report += stdout || stderr;
                    }
                    resolve();
                });
            });
        });

        // 2. Check key required tables
        report += '\n2. Required Tables Presence:\n';
        await new Promise((resolve) => {
            const sql = `
                SELECT 
                    'public.audit_logs' as table_name, to_regclass('public.audit_logs')::text as regclass UNION ALL
                SELECT 
                    'public.financial_periods', to_regclass('public.financial_periods')::text UNION ALL
                SELECT 
                    'public.idempotency_records', to_regclass('public.idempotency_records')::text UNION ALL
                SELECT 
                    'public.outbox_events', to_regclass('public.outbox_events')::text;
            `;
            const cmd = `psql -h localhost -p 5432 -U postgres -d ${dbName} -c "${sql}"`;
            conn.exec(cmd, (err, stream) => {
                let stdout = '';
                stream.on('data', d => { stdout += d.toString(); });
                stream.on('close', () => {
                    report += stdout;
                    resolve();
                });
            });
        });

        // 3. For audit_logs
        report += '\n3. Audit Logs Info:\n';
        await new Promise((resolve) => {
            const sql = 'SELECT COUNT(*) as count, MIN("created_at") as min_created, MAX("created_at") as max_created FROM audit_logs;';
            const cmd = `psql -h localhost -p 5432 -U postgres -d ${dbName} -c "${sql}"`;
            conn.exec(cmd, (err, stream) => {
                let stdout = '', stderr = '';
                stream.on('data', d => { stdout += d.toString(); });
                stream.stderr.on('data', d => { stderr += d.toString(); });
                stream.on('close', () => {
                    report += stdout || stderr;
                    resolve();
                });
            });
        });

        // 4. For users table security
        report += '\n4. Users Table Column Metadata:\n';
        await new Promise((resolve) => {
            const sql = `
                SELECT column_name, data_type
                FROM information_schema.columns
                WHERE table_name='users'
                ORDER BY ordinal_position;
            `;
            const cmd = `psql -h localhost -p 5432 -U postgres -d ${dbName} -c "${sql}"`;
            conn.exec(cmd, (err, stream) => {
                let stdout = '';
                stream.on('data', d => { stdout += d.toString(); });
                stream.on('close', () => {
                    report += stdout;
                    resolve();
                });
            });
        });
    }

    fs.writeFileSync('tmp/db_history_report.txt', report);
    console.log('Saved db history report to tmp/db_history_report.txt');
    conn.end();
}).connect(SERVER);
