const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmds = `
        echo "Testing native psql connection for n2_db..."
        psql "postgresql://n2_db:n2_pass123@localhost:5432/n2_db?schema=public" -c "CREATE TABLE test_table (id INT);"
        psql "postgresql://n2_db:n2_pass123@localhost:5432/n2_db?schema=public" -c "DROP TABLE test_table;"
    `;
    conn.exec(cmds, (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.stderr.on('data', d => out += d.toString());
        stream.on('close', () => {
            console.log("=== NATIVE PSQL OUTPUT ===");
            console.log(out);
            console.log("=========================");
            conn.end();
        });
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    keepaliveInterval: 10000
});
