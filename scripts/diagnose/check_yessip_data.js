const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
echo "--- All settings in yessip_db ---"
sudo -u postgres psql -h localhost -p 5432 -U postgres -d yessip_db -t -c "SELECT key, value FROM settings ORDER BY key;"
echo "--- Company-info related settings ---"
sudo -u postgres psql -h localhost -p 5432 -U postgres -d yessip_db -t -c "SELECT key, value FROM settings WHERE key IN ('company_name','company_name_en','tax_number','company_phone','company_address','zatca_city','zatca_district','zatca_street','zatca_building','zatca_crn','zatca_postal_code');"
echo "--- Branches ---"
sudo -u postgres psql -h localhost -p 5432 -U postgres -d yessip_db -t -c "SELECT * FROM branches;"
echo "--- Users ---"
sudo -u postgres psql -h localhost -p 5432 -U postgres -d yessip_db -t -c "SELECT id, username, full_name, role FROM users;"
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
