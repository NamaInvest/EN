const { Client } = require('ssh2'); 
const fs = require('fs');
const conn = new Client(); 

const query = `
DO $$ 
DECLARE 
    r RECORD;
    cnt_default INTEGER;
    cnt_n11 INTEGER;
    cnt_null INTEGER;
BEGIN 
    RAISE NOTICE '--- n11_db Audit ---';
    FOR r IN (SELECT table_name FROM information_schema.columns WHERE column_name = 'tenant_id' AND table_schema = 'public' AND data_type IN ('character varying', 'text')) 
    LOOP 
        EXECUTE 'SELECT count(*) FROM ' || quote_ident(r.table_name) || ' WHERE tenant_id = ''default''' INTO cnt_default;
        EXECUTE 'SELECT count(*) FROM ' || quote_ident(r.table_name) || ' WHERE tenant_id = ''n11''' INTO cnt_n11;
        EXECUTE 'SELECT count(*) FROM ' || quote_ident(r.table_name) || ' WHERE tenant_id IS NULL OR tenant_id = ''''' INTO cnt_null;
        
        IF cnt_default > 0 OR cnt_n11 > 0 OR cnt_null > 0 THEN
            RAISE NOTICE 'Table: % | default: % | n11: % | NULL/Empty: %', r.table_name, cnt_default, cnt_n11, cnt_null;
        END IF;
    END LOOP; 
END $$;
`;

fs.writeFileSync('audit_n11.sql', query);

conn.on('ready', () => { 
  conn.sftp((err, sftp) => {
    sftp.fastPut('audit_n11.sql', '/tmp/audit_n11.sql', err => {
      conn.exec('sudo -u postgres psql -h localhost -p 5432 -d n11_db -f /tmp/audit_n11.sql', (err, stream) => { 
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => conn.end());
      }); 
    });
  });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
