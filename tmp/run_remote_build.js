const { Client } = require('ssh2');

const SERVER = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
};

const conn = new Client();

conn.on('ready', async () => {
    console.log('CONNECTED TO FLEET SERVER successfully.');
    
    // 1. Run typecheck
    console.log('\n=========================================');
    console.log('1. RUNNING TYPECHECK ON SERVER...');
    console.log('=========================================');
    await new Promise((resolve, reject) => {
        conn.exec('cd /www/wwwroot/namainvist.com && npm run typecheck', (err, stream) => {
            if (err) return reject(err);
            stream.on('data', d => process.stdout.write(d.toString()))
                  .stderr.on('data', d => process.stderr.write(d.toString()))
                  .on('close', (code) => {
                      console.log(`Typecheck exited with code ${code}`);
                      if (code !== 0) process.exit(1);
                      resolve();
                  });
        });
    });

    // 2. Prisma Validate
    console.log('\n=========================================');
    console.log('2. RUNNING PRISMA VALIDATE ON SERVER...');
    console.log('=========================================');
    await new Promise((resolve) => {
        conn.exec('cd /www/wwwroot/namainvist.com && npx prisma validate', (err, stream) => {
            stream.on('data', d => process.stdout.write(d.toString()))
                  .stderr.on('data', d => process.stderr.write(d.toString()))
                  .on('close', resolve);
        });
    });

    // 3. Build Codebase
    console.log('\n=========================================');
    console.log('3. RUNNING BUILD ON SERVER...');
    console.log('=========================================');
    await new Promise((resolve, reject) => {
        conn.exec('cd /www/wwwroot/namainvist.com && npm run build', (err, stream) => {
            if (err) return reject(err);
            stream.on('data', d => process.stdout.write(d.toString()))
                  .stderr.on('data', d => process.stderr.write(d.toString()))
                  .on('close', (code) => {
                      console.log(`Build exited with code ${code}`);
                      if (code !== 0) process.exit(1);
                      resolve();
                  });
        });
    });

    // 4. Run tests
    const tests = [
        'src/__tests__/permissions/backend-rbac.test.ts',
        'src/__tests__/permissions/security-sanitization.test.ts',
        'src/__tests__/permissions/siem-detection.test.ts'
    ];
    
    for (let i = 0; i < tests.length; i++) {
        const testPath = tests[i];
        console.log(`\n=========================================`);
        console.log(`4.${i+1} RUNNING JEST TEST: ${testPath}`);
        console.log(`=========================================`);
        await new Promise((resolve) => {
            conn.exec(`cd /www/wwwroot/namainvist.com && npx jest ${testPath} --runInBand --forceExit`, (err, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()))
                      .stderr.on('data', d => process.stderr.write(d.toString()))
                      .on('close', resolve);
            });
        });
    }

    conn.end();
}).connect(SERVER);
