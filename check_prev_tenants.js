const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
for db in yessip_db theaccountantgrew_db; do
  TENANT=$(echo $db | sed 's/_db//')
  echo "=== $TENANT ==="
  NAME=$(sudo -u postgres psql -h localhost -p 5432 -U postgres -d $db -t -c "SELECT value FROM settings WHERE key='company_name';" 2>/dev/null | tr -d ' ')
  PHONE=$(sudo -u postgres psql -h localhost -p 5432 -U postgres -d $db -t -c "SELECT value FROM settings WHERE key='company_phone';" 2>/dev/null | tr -d ' ')
  USERS=$(sudo -u postgres psql -h localhost -p 5432 -U postgres -d $db -t -c "SELECT username, role FROM users;" 2>/dev/null)
  BRANCH=$(sudo -u postgres psql -h localhost -p 5432 -U postgres -d $db -t -c "SELECT name FROM branches LIMIT 1;" 2>/dev/null | tr -d ' ')
  echo "  Company: $NAME | Phone: $PHONE"
  echo "  Users: $USERS"
  echo "  Branch: $BRANCH"
  echo ""
done
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
