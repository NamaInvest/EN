const { Client } = require('pg'); 
const client = new Client({ connectionString: 'postgresql://postgres:root@localhost:5432/namasoft?schema=public' }); 
client.connect()
  .then(() => client.query("SELECT * FROM tenant_accounts"))
  .then(res => { 
      console.log(res.rows); 
      client.end(); 
  })
  .catch(console.error);
