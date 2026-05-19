const { Client } = require('ssh2'); 
const fs = require('fs');
const conn = new Client(); 

const queryN11 = `
DO $$ 
DECLARE 
    r RECORD;
BEGIN 
    FOR r IN (SELECT table_name FROM information_schema.columns WHERE column_name = 'tenant_id' AND table_schema = 'public' AND data_type IN ('character varying', 'text')) 
    LOOP 
        EXECUTE 'UPDATE ' || quote_ident(r.table_name) || ' SET tenant_id = ''n11'' WHERE tenant_id = ''default'''; 
    END LOOP; 
END $$;
`;
const queryN1 = `
DO $$ 
DECLARE 
    r RECORD;
BEGIN 
    FOR r IN (SELECT table_name FROM information_schema.columns WHERE column_name = 'tenant_id' AND table_schema = 'public' AND data_type IN ('character varying', 'text')) 
    LOOP 
        EXECUTE 'UPDATE ' || quote_ident(r.table_name) || ' SET tenant_id = ''n1'' WHERE tenant_id = ''default'''; 
    END LOOP; 
END $$;
`;

fs.writeFileSync('fix_n11.sql', queryN11);
fs.writeFileSync('fix_n1.sql', queryN1);

conn.on('ready', () => { 
  conn.sftp((err, sftp) => {
    sftp.fastPut('fix_n11.sql', '/tmp/fix_n11.sql', err => {
      sftp.fastPut('fix_n1.sql', '/tmp/fix_n1.sql', err => {
        conn.exec('sudo -u postgres psql -h localhost -p 5432 -d n11_db -f /tmp/fix_n11.sql', (err, stream) => { 
          stream.on('data', d => process.stdout.write(d));
          stream.stderr.on('data', d => process.stderr.write(d));
          stream.on('close', () => {
            conn.exec('sudo -u postgres psql -h localhost -p 5432 -d n1_db -f /tmp/fix_n1.sql', (err2, stream2) => {
              stream2.on('data', d => process.stdout.write(d));
              stream2.stderr.on('data', d => process.stderr.write(d));
              stream2.on('close', () => conn.end());
            });
          });
        }); 
      });
    });
  });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
