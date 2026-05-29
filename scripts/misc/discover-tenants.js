const { Client } = require('ssh2');

function ssh(cmd) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => {
      c.exec(cmd, (err, stream) => {
        let out = '';
        stream.on('data', d => { out += d; });
        stream.stderr.on('data', d => { out += d; });
        stream.on('close', () => { c.end(); r(out.trim()); });
      });
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
  });
}

(async () => {
  // 1. Find all .env files with DATABASE_URL
  console.log('=== Discovering ALL tenant .env files ===\n');
  const result = await ssh('grep -r "DATABASE_URL" /www/wwwroot/*/.env 2>/dev/null');
  const lines = result.split('\n').filter(l => l.includes('postgresql://'));

  const tenants = {};
  for (const line of lines) {
    const match = line.match(/postgresql:\/\/([^:]+):([^@]+)@[^/]+\/([^?"\s]+)/);
    if (match) {
      const file = line.split(':')[0];
      tenants[match[3]] = { file, user: match[1], db: match[3] };
    }
  }

  console.log('Tenant DB Map:');
  console.log(JSON.stringify(tenants, null, 2));

  // 2. Get all postgres roles
  console.log('\n=== All PostgreSQL Roles ===');
  const roles = await ssh('su - postgres -c "psql -t -c \'SELECT rolname FROM pg_roles WHERE rolcanlogin = true;\'"');
  console.log(roles);
})();
