const { Client } = require('ssh2');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    readyTimeout: 30000
};

const cmd = `
export PGPASSWORD="n1_pass123"; 
export PGPASSWORD="n1_pass123"; 
psql -h localhost -p 5432 -U n1_db -d n1_db -c "SELECT count(*) FROM users WHERE branch_id = 2;"
psql -h localhost -p 5432 -U n1_db -d n1_db -c "SELECT count(*) FROM stocks WHERE branch_id = 2;"
psql -h localhost -p 5432 -U n1_db -d n1_db -c "SELECT count(*) FROM sales_invoices WHERE branch_id = 2;"
psql -h localhost -p 5432 -U n1_db -d n1_db -c "SELECT count(*) FROM purchase_invoices WHERE branch_id = 2;"
psql -h localhost -p 5432 -U n1_db -d n1_db -c "SELECT count(*) FROM journal_entries WHERE branch_id = 2;"
psql -h localhost -p 5432 -U n1_db -d n1_db -c "SELECT count(*) FROM employees WHERE branch_id = 2;"
`;

const conn = new Client();
conn.on('ready', () => {
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end());
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
    });
}).on('error', console.error).connect(config);
