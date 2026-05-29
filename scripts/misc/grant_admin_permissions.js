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

nodes=(1 2 3 4 5 6 8 9 10 11)

modules=(
  'pos' 'purchases' 'sales' 'stock' 'treasury' 'hr'
  'users' 'settings' 'accounting' 'manufacturing' 'loyalty'
  'reports' 'crm' 'sales-orders' 'rem' 'smart-transfers' 'fleet' 'projects'
)

for i in "\${nodes[@]}"; do
    target_db="n\${i}_db"
    
    echo "=========================================="
    echo "🔐 Granting All Permissions to Admin on N$i..."

    export PGPASSWORD="n\${i}_pass123"

psql -h localhost -p 5432 -U \${target_db} -d \${target_db} -v ON_ERROR_STOP=1 << EOF
    -- Clear current permissions for admin (assumed user id 1) to avoid duplicate key errors if a unique index exists
    DELETE FROM user_permissions WHERE user_id = 1;
EOF

    for mod in "\${modules[@]}"; do
psql -h localhost -p 5432 -U \${target_db} -d \${target_db} -v ON_ERROR_STOP=1 << EOF
        INSERT INTO user_permissions (user_id, module, can_view, can_add, can_edit, can_delete, can_print)
        VALUES (1, '\${mod}', true, true, true, true, true);
EOF
    done

    echo "✅ Permissions fully granted on N$i"
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
