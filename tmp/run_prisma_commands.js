const { Client } = require('ssh2');

const SERVER = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
};

const conn = new Client();

const dbUrls = {
    n11_db: "postgresql://postgres@localhost:5432/n11_db?schema=public",
    n1_db: "postgresql://postgres@localhost:5432/n1_db?schema=public",
    ahmedalyamicompany_db: "postgresql://postgres@localhost:5432/ahmedalyamicompany_db?schema=public"
};

conn.on('ready', async () => {
    console.log('CONNECTED TO FLEET SERVER successfully.');
    
    // 1. Prisma Validate
    console.log('\n--- Prisma Validate on Server ---');
    await new Promise((resolve) => {
        conn.exec('cd /www/wwwroot/namainvist.com && npx prisma validate', (err, stream) => {
            stream.on('data', d => process.stdout.write(d.toString()))
                  .stderr.on('data', d => process.stderr.write(d.toString()))
                  .on('close', resolve);
        });
    });

    // 2. Migration status for each DB
    for (const [name, url] of Object.entries(dbUrls)) {
        console.log(`\n--- Prisma Migrate Status for ${name} ---`);
        await new Promise((resolve) => {
            conn.exec(`cd /www/wwwroot/namainvist.com && DATABASE_URL="${url}" npx prisma migrate status`, (err, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()))
                      .stderr.on('data', d => process.stderr.write(d.toString()))
                      .on('close', resolve);
            });
        });
    }

    conn.end();
}).connect(SERVER);
