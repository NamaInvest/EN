const { Client } = require('ssh2');
const fs = require('fs');

const N11 = '/www/wwwroot/n11.namainvist.com';

function ssh(c, cmd) {
  return new Promise(r => {
    c.exec(cmd, (err, stream) => {
      let out = '';
      stream.on('data', d => out += d);
      stream.stderr.on('data', d => out += d);
      stream.on('close', () => r(out.trim()));
    });
  });
}

function sftp_upload(sftp, local, remote) {
  return new Promise((res, rej) => sftp.fastPut(local, remote, e => e ? rej(e) : res()));
}

async function run() {
  const c = new Client();
  await new Promise(r => c.on('ready', r).connect({ 
    host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' 
  }));
  
  const sftp = await new Promise((res, rej) => c.sftp((e, s) => e ? rej(e) : res(s)));

  // Read the manufacturing orders route on n11
  console.log('=== Manufacturing Orders Route (current) ===');
  const mfgRoute = await ssh(c, `head -80 "${N11}/src/app/api/manufacturing/orders/route.ts"`);
  console.log(mfgRoute);
  
  console.log('\n=== Local manufacturing orders route ===');
  const localMfg = fs.readFileSync('src/app/api/manufacturing/orders/route.ts', 'utf8');
  
  // Check if local has stock issue  
  if (localMfg.includes('stock:') && localMfg.includes('select:')) {
    console.log('⚠️  Local also has stock include — need to fix both');
  } else {
    console.log('✅ Local version is clean');
    // Upload local version to n11
    await sftp_upload(sftp, 
      'src/app/api/manufacturing/orders/route.ts',
      `${N11}/src/app/api/manufacturing/orders/route.ts`
    );
    console.log('✅ Uploaded clean version to n11');
  }

  // Check tenant API routes - upload missing ones
  console.log('\n=== Uploading missing API tenant routes ===');
  
  // Upload provision if it exists locally
  const localProvision = 'src/app/api/tenant/provision/route.ts';
  if (fs.existsSync(localProvision)) {
    await ssh(c, `mkdir -p "${N11}/src/app/api/tenant/provision"`);
    await sftp_upload(sftp, localProvision, `${N11}/src/app/api/tenant/provision/route.ts`);
    console.log('✅ provision route uploaded');
  }
  
  // Upload trial-status if it exists locally
  const localTrialStatus = 'src/app/api/tenant/trial-status/route.ts';
  if (fs.existsSync(localTrialStatus)) {
    await ssh(c, `mkdir -p "${N11}/src/app/api/tenant/trial-status"`);
    await sftp_upload(sftp, localTrialStatus, `${N11}/src/app/api/tenant/trial-status/route.ts`);
    console.log('✅ trial-status route uploaded');
  }

  // Now run a selective rebuild of just the changed files
  console.log('\n=== Starting n11 rebuild for API fixes ===');
  await ssh(c, `
    cd "${N11}"
    npm run build > /tmp/n11_fix_build.log 2>&1 &
    echo "Build PID: $!"
    echo "Started at: $(date)"
  `);

  c.end();
  console.log('\n⏳ Rebuild started. Will complete in ~3-4 minutes.');
  console.log('Monitor: ssh root@46.4.188.170 "tail -f /tmp/n11_fix_build.log"');
}

run().catch(console.error);
