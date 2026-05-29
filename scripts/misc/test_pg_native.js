const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmds = `
        cat << 'EOF' > /tmp/pg_test.js
const { Client } = require('pg');
const client = new Client("postgresql://n2_db:n2_pass123@localhost:5432/n2_db");
client.connect()
  .then(() => {
     console.log("n2_db Connected!");
     return client.query("CREATE TABLE test_table_pg (id INT);");
  })
  .then(() => {
     console.log("n2_db Created table successfully!");
     return client.query("DROP TABLE test_table_pg;");
  })
  .catch(e => console.error("n2_db PG Error:", e))
  .finally(() => client.end());

const client1 = new Client("postgresql://n1_db:n1_pass123@localhost:5432/n1_db");
client1.connect()
  .then(() => client1.query("SELECT 1;").then(()=>console.log("n1_db connected")))
  .catch(e => console.error(e))
  .finally(() => client1.end());
EOF
        cd /www/wwwroot/n2.namainvist.com
        npm install pg
        node /tmp/pg_test.js
    `;
    conn.exec(cmds, (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.stderr.on('data', d => out += d.toString());
        stream.on('close', () => {
            console.log("=== PG TEST ===");
            console.log(out);
            console.log("===============");
            conn.end();
        });
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: 'process.env.SSH_PASSWORD',
    keepaliveInterval: 10000
});
