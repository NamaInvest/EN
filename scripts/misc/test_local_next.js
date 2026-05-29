const { Client } = require('ssh2'); 
const conn = new Client(); 
conn.on('ready', () => { 
    conn.exec('curl -s -X DELETE http://127.0.0.1:3011/api/sales?action=delete_all -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NzU4NzUzNzIsImV4cCI6MTc3NTk2MTc3Mn0.JI73TP7xcdARTJCwbb1PuWurdstPCRdgtUW89UBCfL8"', (err, stream) => { 
        if (err) throw err; 
        stream.on('data', (d) => process.stdout.write(d)); 
        stream.stderr.on('data', (d) => process.stderr.write(d)); 
        stream.on('close', () => { conn.end(); process.exit(0); }); 
    }); 
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
