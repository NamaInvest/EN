const { execSync } = require('child_process');
const fs = require('fs');

async function check() {
    execSync('npm install sqlite3', { cwd: '/www/wwwroot/n2.namainvist.com' });
    const sqlite3 = require('/www/wwwroot/n2.namainvist.com/node_modules/sqlite3').verbose();
    const db = new sqlite3.Database('/www/wwwroot/n2.namainvist.com/prisma/db.sqlite');
    
    db.all("SELECT key, value FROM Setting WHERE key IN ('zatca_environment', 'tax_number', 'zatca_csr_base64', 'company_name', 'branch_name')", (err, rows) => {
        if(err) throw err;
        console.log("--- N2 DATABASE SETTINGS ---");
        rows.forEach(r => {
            if(r.key === 'zatca_csr_base64') {
                console.log(`[${r.key}] = ${r.value.substring(0, 40)}... (Length: ${r.value.length})`);
                // Decode the base64 to see the real CSR text!
                const decoded = Buffer.from(r.value, 'base64').toString('utf-8');
                console.log(`[DECODED CSR] = ${decoded.substring(0, 100).replace(/\n/g, '\\n')}...`);
            } else {
                console.log(`[${r.key}] = ${r.value}`);
            }
        });
        db.close();
    });
}
check();
