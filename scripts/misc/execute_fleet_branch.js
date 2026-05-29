const { Client } = require('ssh2');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: 'process.env.SSH_PASSWORD',
    readyTimeout: 30000
};

const cmd = `
#!/bin/bash
set -e

nodes=(1 2 3 4 5 6 8 9 10)

for i in "\${nodes[@]}"; do
    target_db="n\${i}_db"
    export PGPASSWORD="n\${i}_pass123"
    
    echo "=========================================="
    echo "🏢 Standardizing Node N$i ($target_db)..."
    
psql -h localhost -p 5432 -U \${target_db} -d \${target_db} -v ON_ERROR_STOP=1 << 'EOF'
    -- Free up foreign keys temporarily
    UPDATE users SET branch_id = NULL;
    UPDATE stocks SET branch_id = NULL;
    
    -- Wipe existing
    DELETE FROM stocks;
    DELETE FROM branches;
    
    -- Wipe related core tables just to be sure there are no orphans?
    -- No, only those causing constraints if any existed. They are fresh anyway!

    -- Reset sequences safely
    ALTER SEQUENCE branches_id_seq RESTART WITH 1;
    ALTER SEQUENCE stocks_id_seq RESTART WITH 1;

    -- Create EXACT 'الفرع الرئيسي' AT ID = 1
    INSERT INTO branches (id, name, is_active, created_at, company_id) 
    VALUES (1, 'الفرع الرئيسي', true, NOW(), 1)
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

    -- Create EXACT 'المستودع الرئيسي' AT ID = 1
    INSERT INTO stocks (id, name, active, branch_id) 
    VALUES (1, 'المستودع الرئيسي', true, 1)
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, branch_id = EXCLUDED.branch_id;

    -- Sync sequence increment logically so the next ones inserted are at 2
    SELECT setval('branches_id_seq', (SELECT MAX(id) FROM branches));
    SELECT setval('stocks_id_seq', (SELECT MAX(id) FROM stocks));

    -- Link all existing users to the Main Branch!
    UPDATE users SET branch_id = 1;
EOF

    echo "✅ Node N$i Successfully Unified."
done
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
