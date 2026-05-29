const { Client } = require('ssh2');
const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' };
const REMOTE = '/www/wwwroot/n11.namainvist.com';
const conn = new Client();
conn.on('ready', async () => {
    const cmds = [
        // Connection user
        `cd ${REMOTE} && BASE_URL="$(grep '^DATABASE_URL' .env | cut -d '=' -f2- | tr -d '"' | tr -d "'" | sed 's/?.*$//')" && echo "Base URL: $BASE_URL"`,
        // Owner of nama_main_db
        `cd ${REMOTE} && BASE_URL="$(grep '^DATABASE_URL' .env | cut -d '=' -f2- | tr -d '"' | tr -d "'" | sed 's/?.*$//')" && TENANT_URL="$(echo "$BASE_URL" | sed 's|/[^/]*$|/postgres|')" && psql "$TENANT_URL" -t -c "SELECT datname, pg_get_userbyid(datdba) AS owner FROM pg_database WHERE datname = 'nama_main_db';"`,
        // Current connecting user
        `cd ${REMOTE} && BASE_URL="$(grep '^DATABASE_URL' .env | cut -d '=' -f2- | tr -d '"' | tr -d "'" | sed 's/?.*$//')" && TENANT_URL="$(echo "$BASE_URL" | sed 's|/[^/]*$|/nama_main_db|')" && psql "$TENANT_URL" -t -c "SELECT current_user, current_database();"`,
        // Schema permissions
        `cd ${REMOTE} && BASE_URL="$(grep '^DATABASE_URL' .env | cut -d '=' -f2- | tr -d '"' | tr -d "'" | sed 's/?.*$//')" && TENANT_URL="$(echo "$BASE_URL" | sed 's|/[^/]*$|/nama_main_db|')" && psql "$TENANT_URL" -t -c "SELECT nspname, pg_get_userbyid(nspowner) AS owner FROM pg_namespace WHERE nspname = 'public';"`,
        // List existing tables to see if it's already initialized
        `cd ${REMOTE} && BASE_URL="$(grep '^DATABASE_URL' .env | cut -d '=' -f2- | tr -d '"' | tr -d "'" | sed 's/?.*$//')" && TENANT_URL="$(echo "$BASE_URL" | sed 's|/[^/]*$|/nama_main_db|')" && psql "$TENANT_URL" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';"`,
    ];
    for (const cmd of cmds) {
        const out = await new Promise((res) => {
            conn.exec(cmd, (e, s) => {
                let o = '';
                s.on('data', d => o += d);
                s.stderr.on('data', d => o += d);
                s.on('close', () => res(o));
            });
        });
        console.log(out.trim());
        console.log('---');
    }
    conn.end();
});
conn.connect(SERVER);
