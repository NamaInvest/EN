const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    console.log('Connected! Running live diagnostic on N3...\n');

    // Run node directly on the server to test if the translations object works
    const testScript = `
cd /www/wwwroot/n3.namainvist.com

# Test 1: Can Node.js actually parse the translations?
node -e "
  // Load the raw tsx file content and extract the translations object
  const fs = require('fs');
  const content = fs.readFileSync('src/lib/i18n.tsx', 'utf-8');
  
  // Find the ar section - look for dashboard.title
  const hasDashTitle = content.includes(\\\"'dashboard.title':\\\");
  console.log('File has dashboard.title key:', hasDashTitle);
  
  // Check which section it's in - count where it appears
  const lines = content.split('\\\\n');
  let arStart = -1, arEnd = -1;
  let inAr = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('ar: {') || lines[i].includes(\\\"ar: {\\\")) { arStart = i; inAr = true; }
    if (inAr && lines[i].trim() === '},') { arEnd = i; inAr = false; break; }
  }
  console.log('ar section: lines', arStart, 'to', arEnd);
  
  // Count dashboard keys before arEnd
  let dashInAr = 0;
  for (let i = arStart; i <= arEnd; i++) {
    if (lines[i] && lines[i].includes('dashboard.')) dashInAr++;
  }
  console.log('dashboard.* keys in ar section:', dashInAr);
" 2>&1

echo ""
echo "=== Test 2: Check the BUILT JS chunks for dashboard.title ==="
grep -r "dashboard.title" .next/static/chunks/ 2>/dev/null | head -3 || echo "NOT FOUND in built chunks!"
echo ""
grep -r "dashboard.title" .next/server/ 2>/dev/null | head -3 || echo "NOT FOUND in server build!"
echo ""
echo "=== Test 3: Check built chunks for common.sar ==="
grep -r "common.sar" .next/static/chunks/ 2>/dev/null | head -3 || echo "NOT FOUND in built chunks!"

echo ""
echo "=== Test 4: Check if sys.str_549 IS in built chunks ==="
grep -rl "sys.str_549" .next/static/chunks/ 2>/dev/null | head -3 || echo "NOT FOUND"

echo ""
echo "=== Test 5: search for Arabic dashboard text in chunks ==="
grep -rl "لوحة التحكم" .next/static/chunks/ 2>/dev/null | head -3 || echo "NOT FOUND"
`;

    conn.exec(testScript, (err, stream) => {
        if (err) { console.error(err); conn.end(); return; }
        let out = '';
        stream.on('data', d => { out += d.toString(); process.stdout.write(d); });
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => {
            console.log('\n--- Done ---');
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
