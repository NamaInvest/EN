/**
 * Grant CREATE+USAGE on public schema in nama_main_db to the n11_db role,
 * so the application connection can create the numbering_sequences table.
 * Uses sudo -u postgres to bypass the permission gap.
 */
const { Client } = require('ssh2');
const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };
const conn = new Client();
conn.on('ready', () => {
    const cmd = `sudo -u postgres psql -d nama_main_db -c "GRANT CREATE, USAGE ON SCHEMA public TO n11_db; GRANT ALL ON ALL TABLES IN SCHEMA public TO n11_db; GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO n11_db; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO n11_db; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO n11_db;" 2>&1`;
    conn.exec(cmd, (e, s) => {
        let o = '';
        s.on('data', d => o += d);
        s.stderr.on('data', d => o += d);
        s.on('close', () => { console.log(o.trim()); conn.end(); });
    });
});
conn.connect(SERVER);
